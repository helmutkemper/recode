package terminal

import (
	"_util/nodeRed"

	"github.com/rivo/tview"
)

func (e *App) addNewConnectionPage() {
	menuList := tview.NewList()
	menuList.
		SetBorder(true).
		SetTitle(" Menu ")

	menuList.AddItem("Return", "Return to main menu", 'r', func() { e.sendToFront("main") })

	listOfTypes := []string{
		"not defined",
		"custom",
		"msg",
		"flow",
		"global",
		"str",
		"num",
		"bool",
		"json",
		"date",
		"re",
		"env",
		"jsonata",
	}

	descriptionOfTypes := []string{
		"Não define um tipo",
		"Define um tipo personalizado",
		"msg: Caminho em msg (ex.: msg.payload). Lido em runtime.",
		"flow: Variável de contexto de fluxo (ex.: flow.token via flow.get(\"token\")).",
		"global: Variável de contexto global (ex.: global.baseUrl via global.get(\"baseUrl\")).",
		"str: String literal (texto).",
		"num: Número literal (ex.: 42).",
		"bool: Booleano literal (true/false).",
		"json: JSON literal (objeto/array), convertido para JS.",
		"date: Timestamp atual em ms (Date.now()) no momento da execução.",
		"re: Expressão regular JavaScript (ex.: /^ab+c$/i).",
		"env: Variável de ambiente por nome (ex.: MY_TOKEN → process.env.MY_TOKEN).",
		"jsonata: Expressão JSONata avaliada contra msg/flow/global (ex.: $uppercase(msg.topic)).",
	}

	index := 0
	nodeConn := nodeRed.NodeConnection{}

	descriptionView := tview.NewTextView().
		SetDynamicColors(true).
		SetScrollable(true).
		SetText(descriptionOfTypes[index]).SetSize(1, 0)

	form := tview.NewForm()
	form.AddInputField("title", "", 0, func(textToCheck string, lastChar rune) bool { return e.bookRules.RegexName.MatchString(textToCheck) }, func(text string) { nodeConn.Title = text }).
		AddTextArea("description", "", 0, 3, 0, func(text string) { nodeConn.Description = text }).
		AddDropDown("type", listOfTypes, 0, func(option string, optionIndex int) {
			nodeConn.Type = option
			index = optionIndex
			descriptionView.SetText(descriptionOfTypes[index])
		}).
		AddFormItem(descriptionView).
		AddButton("Add", func() {})
	form.SetBorder(true)

	// secondForm
	//
	// English:
	//   Second form placed below the first one. For now it is just a simple example
	//   with one extra input field, but structurally it allows two stacked forms.
	//
	// Português:
	//   Segundo formulário colocado abaixo do primeiro. Por enquanto é apenas um
	//   exemplo simples com um campo extra, mas estruturalmente permite dois forms empilhados.
	secondForm := tview.NewForm().
		AddInputField("extra", "", 0, nil, nil)
	secondForm.SetBorder(true).SetTitle(" Extra ")

	// formsLayout
	//
	// English:
	//   Vertical Flex to stack form and secondForm (form on top, secondForm below).
	//
	// Português:
	//   Flex vertical para empilhar o form e o secondForm (form em cima, secondForm embaixo).
	formsLayout := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(form, 0, 1, false).
		AddItem(secondForm, 0, 1, false)

	layout := tview.NewFlex()
	layout.
		AddItem(menuList, 25, 1, true).
		// Before: .AddItem(form, 0, 3, false)
		// Now we use the vertical container with both forms:
		AddItem(formsLayout, 0, 3, false)

	e.pages.AddPage("createInput", layout, true, true)
	e.setPageRegister("createInput", menuList, form, secondForm, form)
}
