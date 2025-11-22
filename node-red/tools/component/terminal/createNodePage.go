package terminal

import (
	"_util/nodeRed"

	"github.com/rivo/tview"
)

func (e *App) createNodePage() {
	// Create the list that will appear on the left side.
	// Cria a lista que ficará do lado esquerdo.
	menuList := tview.NewList()
	menuList.
		SetBorder(true).   // Draw a border around the list. / Desenha uma borda ao redor da lista.
		SetTitle(" Menu ") // Title of the list box. / Título da caixa da lista.

	menuList.AddItem("Add input", "Add new input", 'i', func() { e.sendToFront("createInput") })
	menuList.AddItem("Add output", "Add new output", 'o', func() { e.sendToFront("main") })
	menuList.AddItem("Return", "Return to main menu", 'r', func() { e.sendToFront("main") })
	//menuList.AddItem("Quit", "Press to exit", 'q', func() {
	//	e.app.Stop()
	//})

	//listOfTypes := []string{"custom", "msg", "flow", "global", "str", "num", "bool", "json", "date", "re", "env", "jsonata"}

	nodeData := nodeRed.NodeData{}

	form := tview.NewForm().
		AddInputField("name", "", 0, func(textToCheck string, lastChar rune) bool { return e.bookRules.RegexName.MatchString(textToCheck) }, func(text string) { nodeData.Name = text }).
		AddTextArea("help", "", 0, 3, 0, func(text string) { nodeData.Help = text }).
		AddTextArea("input", "", 0, 3, 0, func(text string) { nodeData.InputTxt = text }).
		AddTextArea("output", "", 0, 3, 0, func(text string) { nodeData.OutputTxt = text }).
		AddTextArea("details", "", 0, 3, 0, func(text string) { nodeData.Details = text }).
		AddButton("Save", func() {})
	form.SetBorder(true)

	// Create a Flex in column mode (left and right areas).
	// Cria um Flex no modo colunas (área esquerda e direita).
	layout := tview.NewFlex()

	// Add the left list with a fixed width, and the right box taking the rest.
	// Adiciona a lista da esquerda com largura fixa e a caixa da direita ocupando o restante.
	layout.
		AddItem(menuList, 25, 1, true).
		AddItem(form, 0, 3, false)

	e.pages.AddPage("createNode", layout, true, true)
	e.setPageRegister("createNode", menuList, form)
}
