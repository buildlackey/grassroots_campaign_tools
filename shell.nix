{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.google-cloud-sdk
    pkgs.yarn
  ];

  shellHook = ''
    ROOT=$(git rev-parse --show-toplevel)
    export PATH="$ROOT/node_modules/.bin:$PATH"

    if [ ! -x "$ROOT/node_modules/.bin/clasp" ]; then
      echo "⚙️  Installing clasp@3.x via npm..."
      cd "$ROOT"
      npm install @google/clasp@3.0.3-alpha
    fi
  '';
}

