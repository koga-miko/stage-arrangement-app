export const PartsActionState = {
    Idle: 'Idle',               // 特になし
    ShortDown: 'ShortDown',     // MouseDownで選択されたが次のアクションが決まっていない
    LongDown: 'LongDown',       // 領域上で長めに押され続けた後の特別選択状態
    Moving: 'Moving',           // 特別選択状態でMouseMoveした状態
    Selected: 'Selected',       // 矩形選択等で選択されている状態
}

class PartsAction {
    constructor(partsName, onlyMoving = false) {
        this.actState = PartsActionState.Idle
        this.timeIdForSpecialSel = null
        this.callbackFn = null
        this.partsName = partsName
        this.onlyMoving = onlyMoving
        this.movStaOfst = {x:0, y:0}
    }

    // ヒットしたかどうか(派生先でオーバーライドすること)
    // isHit(x,y) {
    //     return false
    // }

    // 選択された(派生先でオーバーライドすること)
    // onClick(isSpecial) {
    // }

    // 状態変化通知(必要に応じて派生先でオーバーライドすること)
    changedPartsActionState(state) {
    }

    changedPartsActionStateBase(state) {
        this.changedPartsActionState(state)
        if (this.callbackFn != null) {
            this.callbackFn(this.partsName, state)
        }
    }

    registerCallback(callbackFn) {
        this.callbackFn = callbackFn
    }

    getState() {
        return this.actState
    }

    changePosBase(x, y) {
        this.changePos(x - this.movStaOfst.x, y -  this.movStaOfst.y)
    }

    onMouseDown(x, y, event) {
        let hit = this.isHit(x, y)
        switch(this.actState) {
            case PartsActionState.Idle:
                if(hit === true) {
                    this.movStaOfst = {x:x - this.x, y:y - this.y}
                    if (this.onlyMoving) {
                        // Moving状態へ遷移
                        this.actState = PartsActionState.Moving
                    } else {
                        // 選択状態へ遷移
                        this.actState = PartsActionState.ShortDown
                        // タイムアウト時間設定
                        this.timeIdForSpecialSel = setTimeout(()=>{
                            // タイムアウトしたら特別選択状態へ遷移
                            this.actState = PartsActionState.LongDown
                            // タイムアウトIDはクリア
                            this.timeIdForSpecialSel = null
                        }, 600)
                    }
                }
                break
            default:
                // 状態をクリア
                this.clearState()
                break
        }
    }

    onMouseMove(x, y, event) {
        let hit = this.isHit(x, y)
        switch(this.actState) {
            case PartsActionState.ShortDown:
                if(hit === false) {
                    // ヒット対象からはずれていたら状態クリア
                    this.clearState()
                }
                break
            case PartsActionState.LongDown:
                // ヒット対象からはずれていたらMoving状態へ遷移
                if(hit === false) {
                    this.actState = PartsActionState.Moving
                    this.changePosBase(x, y)
                }
                break
            case PartsActionState.Moving:
                this.changePosBase(x, y)
                break
            default:
                // 状態をクリア
                this.clearState()
                break
        }
    }

    onMouseUp(x, y, event) {
        let hit = this.isHit(x, y)
        switch(this.actState) {
            case PartsActionState.ShortDown:
                this.clearState()
                if (hit === true) {
                    this.onClick(false)
                    this.changedPartsActionStateBase(this.actState); // 状態変化通知
                }
                break
            case PartsActionState.LongDown:
                this.clearState()
                if (hit === true) {
                    this.onClick(true)
                    this.changedPartsActionStateBase(this.actState); // 状態変化通知
                }
                break
            case PartsActionState.Moving:
                this.clearState()
                this.changePosBase(x, y)
                this.changedPartsActionStateBase(this.actState); // 状態変化通知
                break
            default:
                this.clearState()
                break
        }
    }

    clearState() {
        // タイマー稼働中なら停止
        if(this.timeIdForSpecialSel !== null) {
            clearTimeout(this.timeIdForSpecialSel)
            this.timeIdForSpecialSel = null
        }
        // IDLE状態へ戻すが状態変化ありなら状態変化を通知する
        if (this.actState !== PartsActionState.Idle) {
            this.actState = PartsActionState.Idle
        }
    }
}

export default PartsAction