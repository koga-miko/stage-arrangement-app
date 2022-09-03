import PartsAction from './PartsAction'
class Seat extends PartsAction {
    static VisualState = {
        Hide: 'H',              // 非表示状態
        Normal: 'N',            // 通常状態
        Black: 'B',             // 真っ黒の状態
        Red: 'R',               // SpecialMode: 枠が赤の状態
        RedAndBlack: 'RB',      // SpecialMode: 枠が赤で中が真っ黒の状態
        DoubleCircle: 'DC',     // SpecialMode: 二重丸
    }
    
    constructor(partsName, x, y, radius, groupId) {
        super(partsName)
        this.x = parseInt(x)
        this.y = parseInt(y)
        this.radius = parseInt(radius)
        this.visualState = Seat.VisualState.Normal
        this.groupId = groupId
        this.selected = false
    }

    serializeData(){
        return JSON.stringify({
            x: this.x,
            y: this.y,
//            r: this.radius,
            v: this.visualState,
            g: this.groupId,
            a: this.actState, // 派生元クラスPartsActionの分
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
//        this.radius = obj.r
        this.visualState = obj.v
        this.groupId = obj.g
        this.actState = obj.a // 派生元クラスPartsActionの分
    }

    changeState() {
        switch (this.visualState) {
            case Seat.VisualState.Normal:
                this.visualState = Seat.VisualState.Hide
                break
            case Seat.VisualState.Hide:
                this.visualState = Seat.VisualState.Black
                break
            case Seat.VisualState.Black:
                this.visualState = Seat.VisualState.Normal
                break
            default:
                this.visualState = Seat.VisualState.Normal
        }
    }

    changeSpecialState() {
        switch (this.visualState) {
            case Seat.VisualState.Red:
                this.visualState = Seat.VisualState.RedAndBlack
                break
            case Seat.VisualState.RedAndBlack:
                this.visualState = Seat.VisualState.DoubleCircle
                break
            case Seat.VisualState.DoubleCircle:
                this.visualState = Seat.VisualState.Red
                break
            default:
                this.visualState = Seat.VisualState.Red
        }
    }

    setVisualState(state) {
        this.visualState = state
    }

    changePos(x, y) {
        this.x = parseInt(x)
        this.y = parseInt(y)
    }

    getPos() {
        return [this.x, this.y]
    }

    getActDispPoints() {
        return { 
            visible:this.visualState !== Seat.VisualState.Hide,
            staPos: { x:this.x - this.radius, y:this.y - this.radius },
            endPos: { x:this.x + this.radius, y:this.y + this.radius },
        }
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
            case Seat.VisualState.Normal:
            case Seat.VisualState.Red:
            case Seat.VisualState.Black:
            case Seat.VisualState.RedAndBlack:
            case Seat.VisualState.DoubleCircle:
                active = true
                break
            default:
                break
        }
        return active
    }

    isStandardSeat() {
        let active = false
        switch (this.visualState) {
            case Seat.VisualState.Normal:
            case Seat.VisualState.Red:
            case Seat.VisualState.Black:
            case Seat.VisualState.RedAndBlack:
                active = true
                break
            default:
                break
        }
        return active
    }

    isPianoSeat() {
        let active = false
        switch (this.visualState) {
            case Seat.VisualState.DoubleCircle:
                active = true
                break
            default:
                break
        }
        return active
    }

    hasPerson() {
        let active = false
        switch (this.visualState) {
            case Seat.VisualState.Normal:
            case Seat.VisualState.Red:
            case Seat.VisualState.DoubleCircle:
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
        if (printing && this.visualState === Seat.VisualState.Hide) {
            return
        }

        ctx.beginPath()
        ctx.setLineDash([])
        ctx.strokeStyle = "black"
        ctx.fillStyle = "white"
        ctx.lineWidth = 2
 
        switch (this.visualState) {
            case Seat.VisualState.Hide:
                ctx.setLineDash([1,3])
                ctx.strokeStyle = "gray"
                ctx.lineWidth = 1
                break
            case Seat.VisualState.Normal:
                break
            case Seat.VisualState.Black:
                ctx.fillStyle = "black"
                break
            case Seat.VisualState.Red:
                ctx.strokeStyle = "rgb(170, 46, 46)"
                ctx.lineWidth = 4
                break
            case Seat.VisualState.RedAndBlack:
                ctx.strokeStyle = "rgb(170, 46, 46)"
                ctx.fillStyle = "black"
                ctx.lineWidth = 3
                break
            case Seat.VisualState.DoubleCircle:
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
        if (!printing && this.visualState !== Seat.VisualState.Hide) {
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