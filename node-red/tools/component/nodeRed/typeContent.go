package nodeRed

type Content struct {
	NodeData []NodeData
}

func (e *Content) Init() {
	e.NodeData = make([]NodeData, 0)
}
