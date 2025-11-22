package nodeRed

type NodeData struct {
	Name      string
	Help      string
	InputTxt  string
	OutputTxt string
	Input     []NodeConnection
	Output    [][]NodeConnection
	Details   string
	Reference []NodeConnection
}
