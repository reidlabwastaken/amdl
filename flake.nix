{
  description = "amdl";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        package = builtins.fromJSON (builtins.readFile ./package.json);
      in {
        packages = flake-utils.lib.flattenTree rec {
          default = amdl;
          amdl = pkgs.buildNpmPackage {
            pname = package.name;
            inherit (package) version;

            # uncomment this and let the build fail, then get the current hash
            # very scuffed but endorsed!
            # npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
            npmDepsHash = "sha256-hMI010P3lJIMCMaj9HYUZopMAWaNQMCG1QXk/OdV1u4=";

            nativeBuildInputs = with pkgs; [ makeWrapper ];

            installPhase = ''
              runHook preInstall

              mkdir -p $out
              mv node_modules dist views public $out/
              makeWrapper ${pkgs.nodejs-slim}/bin/node $out/bin/amdl \
                --add-flags "$out/dist/index.js" \
                --set VIEWS_DIR $out/views \
                --set PUBLIC_DIR $out/public

              runHook postInstall
            '';

            src = ./.;

            meta.mainProgram = package.name;
          };
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            nodePackages.npm

            ffmpeg yt-dlp
          ];
        };
  });
}
