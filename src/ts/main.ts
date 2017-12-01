export class TapeMachine {
    recordedMessage: string;
    constructor() {
        this.recordedMessage = '';
    }
    record(message: string) {
        this.recordedMessage = message;
    }
    play() {
        console.log(this.recordedMessage);
    }
} 