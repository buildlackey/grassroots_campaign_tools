{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.google-cloud-sdk
    pkgs.nodejs
    pkgs.yarn
  ];

  shellHook = ''
    ROOT=$(git rev-parse --show-toplevel)
    export PATH="$ROOT/node_modules/.bin:$PATH"

    if [ ! -f "$ROOT/node_modules/.bin/clasp" ]; then
      echo "⚙️  Installing clasp locally via npm..."
      cd "$ROOT"
      npm install @google/clasp
    fi
  '';
}

