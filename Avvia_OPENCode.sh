#!/bin/bash

# =========================================================================
# SCRIPT DI AVVIO INTERATTIVO PER OPENCODE (Versione Automatica)
# =========================================================================

# --- CONFIGURAZIONE DEI PERCORSI RELATIVI ---
VENV_PATH="./venv_opencode"
OPENDOC_DIR="./opencode-dev"
BASE_DIR="/media/wildlux/HD/AI/OPENCODE"

# Controlla se lo script è stato chiamato dal file 'activate'
# L'opzione --activated è passata solo dal file 'activate' (vedi sopra).
if [[ "$1" == "--activated" ]]; then
    # Se è attivato, rimuoviamo l'argomento in modo che non venga passato a bun run
    shift
    ACTIVATED=true
else
    ACTIVATED=false
fi

# --- 1. SETUP DELL'AMBIENTE ---
echo "--- 1. Setup Ambiente ---"

if [ "$ACTIVATED" = false ]; then
    # Se non è attivo, attiviamo l'ambiente e navighiamo

    echo "Attivazione ambiente virtuale..."
    source "$VENV_PATH/bin/activate" || { echo "Errore nell'attivazione dell'ambiente virtuale. Uscita."; exit 1; }

    echo "Navigazione in $OPENDOC_DIR..."
    cd "$OPENDOC_DIR" || { echo "Errore: Directory $OPENDOC_DIR non trovata. Uscita."; exit 1; }

    # Se lanciato manualmente, continuiamo subito con la richiesta di conferma.

else
    # Se è già attivo (chiamato da 'activate'), dobbiamo solo navigare

    # Nota: Dobbiamo cambiare directory da $BASE_DIR (dove è stato lanciato lo script)
    # alla cartella del progetto.
    echo "Navigazione in $OPENDOC_DIR..."
    cd "$BASE_DIR/$OPENDOC_DIR" || { echo "Errore: Directory $OPENDOC_DIR non trovata. Uscita."; exit 1; }

fi

echo "✅ Ambiente pronto! Posizione: $(pwd)"

# --- 2. RICHIESTA DI CONFERMA ---
# Chiede all'utente se procedere con l'avvio
read -r -p "Posso avviare OpenCode con 'bun run opencode'? (s/n): " conferma

# --- 3. AVVIO CONDIZIONALE ---
if [[ "$conferma" =~ ^[sS]$ ]]; then
    echo "--- Avvio di OpenCode in corso ---"

    # Esegue il comando di avvio senza parametri
    # Notare che il 'cd' è già avvenuto e siamo nella cartella 'opencode-dev'.
    bun run opencode

    echo "--- Processo OpenCode terminato. ---"
else
    echo "❌ Avvio di OpenCode annullato dall'utente."
fi

echo "Il terminale è pronto in $(pwd) con l'ambiente attivo. Per uscire digita 'deactivate'."
