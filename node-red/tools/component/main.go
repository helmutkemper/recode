package main

import (
	"_util/logs"
	"_util/terminal"
	"flag"
)

type nodeApp struct {
	app terminal.App
}

func (e *nodeApp) Init() {
	e.app.Init()
}

// main
//
// English:
//
//	Entry point of the program. It creates the tview application,
//	configures the global keyboard shortcuts and mounts the first page,
//	which is composed by a Flex with a list on the left and an empty
//	area on the right.
//
// Português:
//
//	Ponto de entrada do programa. Cria a aplicação tview,
//	configura atalhos globais de teclado e monta a primeira página,
//	composta por um Flex com uma lista à esquerda e uma área
//	vazia à direita.
func main() {

	logPtr := flag.Bool("log", false, "create a log file named `app.log` in the root of project tree")
	flag.Parse()

	if *logPtr {
		logs.Init()
	}

	nodeApp := new(nodeApp)
	nodeApp.Init()
}
