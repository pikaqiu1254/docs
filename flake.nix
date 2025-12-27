{
  description = "Development shell.";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    pre-commit-hooks = {
      url = "github:cachix/pre-commit-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-parts,
      ...
    }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      debug = false;

      perSystem =
        {
          pkgs,
          lib,
          self',
          inputs',
          ...
        }:
        {
          devShells.default = pkgs.mkShellNoCC {
            shellHook = ''
              if [ ! -e node_modules ]; then
                  export STORE_PATH=$(mktemp -d)

                  cp -Tr "$pnpmDeps" "$STORE_PATH"
                  chmod -R +w "$STORE_PATH"

                  pnpm config set store-dir "$STORE_PATH"

                  pnpm install \
                      --offline \
                      --ignore-scripts \
                      --frozen-lockfile

                  patchShebangs node_modules/{*,.*}
                  export PATH="node_modules/.bin:$PATH"
              fi
            '';
            pnpmDeps = pkgs.pnpm.fetchDeps {
              buildInputs = with pkgs; [
                nodejs
                nodePackages.pnpm
              ];
              fetcherVersion = 2;
              pname = "chenjia-docs";
              version = "0-unstable";
              src = ./.;
              env.NODE_EXTRA_CA_CERTS = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
              hash = "sha256-zxrQ2RFZt6TMQn6nS7AiJ6S+q6BlpJ+m5ZxC33Y7V+E=";
            };
            packages = with pkgs; [
              nodejs
              nodePackages.pnpm
            ];
          };
        };
    };
}
