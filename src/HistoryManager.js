class HistoryManager {
    constructor(callbackFn, maxOfHist = 100) {
        this.maxOfHist = maxOfHist
        this.histories = []
        this.curHistIdx = 0
        this.callbackFn = callbackFn
    }

    registerHistory(hist) {
        const len = this.histories.length
        // まだ履歴が存在しない場合
        if (len === 0) {
            this.histories.push(hist)
            this.curHistIdx = 0
        }
        // 履歴が存在する場合
        else {
            // 現在の履歴インデックスがリスト末端よりも手前の場合
            if (this.curHistIdx < len - 1) {
                // 現在の履歴インデックスよりも後ろの（新しい）履歴を削除する
                this.histories.splice(this.curHistIdx + 1, len - this.curHistIdx - 1)
            }
            // 現在の履歴の後ろに履歴を追加（現在の履歴インデックスを1進める）
            this.histories.push(hist)
            this.curHistIdx++
        }
    }

    isUndoAvail() {
        return this.curHistIdx > 0? true: false
    }

    undo() {
        if (true === this.isUndoAvail()) {
            this.curHistIdx--
            this.callbackFn(this.histories[this.curHistIdx])
        }
    }

    isRedoAvail() {
        return this.curHistIdx < this.histories.length - 1? true: false
    }

    redo() {
        if (true === this.isRedoAvail()) {
            this.curHistIdx++
            this.callbackFn(this.histories[this.curHistIdx])
        }
    }
}

export default HistoryManager