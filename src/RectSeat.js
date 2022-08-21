import PartsAction from './PartsAction'
const SeatVisualState = {
    Hide: 'Hide',
    Normal: 'Normal',
    Black: 'Black',
}

class RectSeat extends PartsAction {
    constructor(partsName, x, y, w, h, groupId) {
        super(partsName)
        this.w = w
        this.h = h
        this.x = x - this.w / 2
        this.y = y - this.h / 2
        this.visualState = SeatVisualState.Normal
        this.groupId = groupId
    }

    serializeData(){
        return JSON.stringify({
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            visualState: this.visualState,
            groupId: this.groupId,
            actState: this.actState, // 派生元クラスPartsActionの分
        })
    }

    deserializeData(serializedData){
        try{
          var obj = JSON.parse(serializedData)
        }catch(e){
          /// エラー時の処理
          console.e('Failed to parse json')
          return
        }
        this.x = obj.x
        this.y = obj.y
        this.w = obj.w
        this.h = obj.h
        this.visualState = obj.visualState
        this.groupId = obj.groupId
        this.actState = obj.actState // 派生元クラスPartsActionの分
    }

    changeState() {
        switch (this.visualState) {
            case SeatVisualState.Normal:
                this.visualState = SeatVisualState.Hide
                break
            case SeatVisualState.Hide:
                this.visualState = SeatVisualState.Black
                break
            case SeatVisualState.Black:
                this.visualState = SeatVisualState.Normal
                break
            default:
                this.visualState = SeatVisualState.Normal
        }
    }

    changePos(x, y) {
        this.x = x - this.w / 2
        this.y = y - this.h / 2
    }

    movePos(x, y) {
        this.x = this.x + x
        this.y = this.y + y
    }

    getPos() {
        return [this.x + this.w / 2, this.y + this.h / 2]
    }

    isHit(x, y) {
        if (this.x <= x && x < (this.x + this.w) && this.y <= y && y < (this.y + this.h)) {
            return true
        }
        return false
    }
    
    onClick(isSpecial) {
        this.changeState()
    }

    isExistence() {
        let active = false
        switch (this.visualState) {
            case SeatVisualState.Normal:
            case SeatVisualState.Black:
                active = true
                break
            default:
                break
        }
        return active
    }

    changedPartsActionState(state) {
        // 特になにもしない
    }

    draw(ctx, printing = false) {

        // 印刷時表示かつHide状態なら描画しない
        if (printing && this.visualState === SeatVisualState.Hide) {
            return
        }

        ctx.beginPath()
        ctx.setLineDash([])
        ctx.strokeStyle = "black"
        ctx.fillStyle = "white"
        ctx.lineWidth = 2
 
        switch (this.visualState) {
            case SeatVisualState.Hide:
                ctx.setLineDash([1,3])
                ctx.strokeStyle = "gray"
                ctx.lineWidth = 1
                break
            case SeatVisualState.Normal:
                break
            case SeatVisualState.Black:
                ctx.fillStyle = "black"
                ctx.fillRect(this.x, this.y, this.w, this.h)
                break
            default:
        }
        ctx.strokeRect(this.x, this.y, this.w, this.h)

        // groupIdの表示
        if (!printing && this.visualState !== SeatVisualState.Hide) {
            ctx.beginPath()
            ctx.font = "16pt 'Arial'"
            ctx.fillStyle = "rgb(89, 107, 176)"
            ctx.textAlign = "center"
            ctx.fillText(`${this.groupId}`,this.x + this.w / 2, this.y + this.h / 2 + 8)
            ctx.fill()
        }
        
    }
}

export default RectSeat