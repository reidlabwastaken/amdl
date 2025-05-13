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
            npmDepsHash = "sha256-f+RacjhkJP3RlK+yKJ8Xm0Rar4NyIxJjNQYDrpqhnD4=";

            installPhase = ''
              mkdir -p $out
              mv ./dist/* $out/
            '';

            src = ./.;
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
