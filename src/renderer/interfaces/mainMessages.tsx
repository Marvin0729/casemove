export interface MessageMain {
    command: number
    text: string
    returnValue: any
}

export interface MessageItems extends MessageMain {
    returnValue: itemRow
}

