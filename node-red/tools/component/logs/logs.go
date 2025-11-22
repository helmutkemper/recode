package logs

import (
	"io"
	"log"
	"os"
)

// Init
//
// English:
//
//	initLogger configures the standard logger to write to a file
//	located in the current working directory (project root when
//	you run `go run .` or the binary from there).
//
//	The logger will write both to stdout and to the log file.
//
// Português:
//
//	initLogger configura o logger padrão para escrever em um arquivo
//	localizado no diretório de trabalho atual (raiz do projeto quando
//	você roda `go run .` ou o binário a partir dessa pasta).
//
//	O logger vai escrever tanto no stdout quanto no arquivo de log.
func Init() {
	// English:
	//  Open (or create) the log file in append mode.
	//
	// Português:
	//  Abre (ou cria) o arquivo de log em modo de append.
	logFile, err := os.OpenFile("app.log",
		os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		// English:
		//  If we can't open the log file, we log to stderr and abort.
		//
		// Português:
		//  Se não for possível abrir o arquivo de log, escrevemos em stderr e abortamos.
		log.Fatalf("failed to open log file: %v", err)
	}

	// English:
	//  Send log output to both stdout and the file.
	//
	// Português:
	//  Envia a saída de log tanto para o stdout quanto para o arquivo.
	//multi := io.MultiWriter(os.Stdout, logFile)
	multi := io.MultiWriter(logFile)

	// English:
	//  Redirect the standard logger output.
	//
	// Português:
	//  Redireciona a saída do logger padrão.
	log.SetOutput(multi)

	// English:
	//  Set timestamp + short file name and line number in each log line.
	//
	// Português:
	//  Coloca timestamp + nome curto do arquivo e linha em cada linha de log.
	log.SetFlags(log.LstdFlags | log.Lshortfile)
}
