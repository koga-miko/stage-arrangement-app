import PartsAction from './PartsAction'
const SeatVisualState = {
    Hide: 'Hide',
    Normal: 'Normal',
    Black: 'Black',
    Red: 'Red',                     // SpecialMode
    RedAndBlack: 'RedAndBlack',     // SpecialMode
    DoubleCircle: 'doubleCircle',   // SpecialMode
}

class Seat extends PartsAction {
    constructor(partsName, x, y, radius, groupId) {
        super(partsName)
        this.x = x
        this.y = y
        this.radius = radius
        this.visualState = SeatVisualState.Normal
        this.groupId = groupId
        this.selected = false
    }

    serializeData(){
        return JSON.stringify({
            x: this.x,
            y: this.y,
            radius: this.radius,
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
        this.radius = obj.radius
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

    hide() {
        this.visualState = SeatVisualState.Hide
    }

    changeSpecialState() {
        switch (this.visualState) {
            case SeatVisualState.Red:
                this.visualState = SeatVisualState.RedAndBlack
                break
            case SeatVisualState.RedAndBlack:
                this.visualState = SeatVisualState.DoubleCircle
                break
            case SeatVisualState.DoubleCircle:
                this.visualState = SeatVisualState.Red
                break
            default:
                this.visualState = SeatVisualState.Red
        }
    }

    changePos(x, y) {
        this.x = x
        this.y = y
    }

    getPos() {
        return [this.x, this.y]
    }

    isHit(x, y) {
        if (Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2) <= Math.pow(this.radius, 2)) {
            return true
        }
        return false
    }
    
    onClick(isSpecial) {
        if (isSpecial === true) {
            this.changeSpecialState()
        } else {
            this.changeState()
        }
    }

    isExistence() {
        let active = false
        switch (this.visualState) {
            case SeatVisualState.Normal:
            case SeatVisualState.Red:
            case SeatVisualState.Black:
            case SeatVisualState.RedAndBlack:
            case SeatVisualState.DoubleCircle:
                active = true
                break
            default:
                break
        }
        return active
    }

    changedPartsActionState(state) {
        // 特に何もしない
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
                break
            case SeatVisualState.Red:
                ctx.strokeStyle = "rgb(170, 46, 46)"
                ctx.lineWidth = 4
                break
            case SeatVisualState.RedAndBlack:
                ctx.strokeStyle = "redrgb(212, 104, 105)"
                ctx.fillStyle = "black"
                ctx.lineWidth = 3
                break
            case SeatVisualState.DoubleCircle:
                ctx.arc(this.x, this.y, this.radius * 0.6, 0, 2 * Math.PI)
                ctx.fill()
                ctx.stroke()
                break
            default:
        }
        ctx.moveTo(this.x + this.radius, this.y)
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // groupIdの表示
        if (!printing && this.visualState !== SeatVisualState.Hide) {
            ctx.beginPath()
            ctx.font = "16pt 'Arial'"
            ctx.fillStyle = "rgb(89, 107, 176)"
            ctx.textAlign = "center"
            ctx.fillText(`${this.groupId}`,this.x, this.y+8)
            ctx.fill()
        }
        
        if(this.selected === true) {
            ctx.beginPath()
            ctx.strokeStyle = "rgb(239, 144, 89)"
            ctx.lineWidth = 3
            ctx.moveTo(this.x + this.radius + ctx.lineWidth, this.y)
            ctx.arc(this.x, this.y, this.radius + ctx.lineWidth, 0, 2 * Math.PI)
            ctx.stroke()
        }
    }
}

export default Seat