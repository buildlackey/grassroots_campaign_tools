{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.google-cloud-sdk
    pkgs.nodejs
    pkgs.yarn
  ];

  shellHook = ''
    export PATH="./node_modules/.bin:$PATH"

    if [ ! -f ./node_modules/.bin/clasp ]; then
      echo "⚙️  Installing clasp locally via npm..."
      npm install @google/clasp
    fi
  '';
}

