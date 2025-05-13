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
            npmDepsHash = "sha256-MYrYRrPFSQHiKQMPafDmWvlcT/rpEmB4S2CXfLIk6Bg=";

            nativeBuildInputs = with pkgs; [ makeWrapper ];

            installPhase = ''
              runHook preInstall

              mkdir -p $out
              mv node_modules dist $out/
              makeWrapper ${pkgs.nodejs-slim}/bin/node $out/bin/amdl \
                --add-flags "$out/dist/index.js"

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
