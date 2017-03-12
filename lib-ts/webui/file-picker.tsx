import * as preact from 'preact';

interface FilePickerProps {
    onTextRead?(text: string): void;
}

export class FilePicker extends preact.Component<FilePickerProps, {}> {

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(ev: Event) {
        const input = ev.target as HTMLInputElement;
        const file0 = input.files[0] as File;
        if (file0 && this.props.onTextRead) {
            const reader = new FileReader();
            reader.addEventListener('load', (loaded) => {
                this.props.onTextRead(reader.result);
            });
            reader.readAsText(file0, "utf8");
        }
    }
    render() {
        return <input type="file" onChange={this.handleChange} />
    }
}