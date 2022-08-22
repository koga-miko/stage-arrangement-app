import PartsAction from './PartsAction'

class MusicStand extends PartsAction {
    State = {
        Hide: 'Hide',
        Black: 'Black',
        Red: 'Red',
    }
    
    constructor(partsName, x, y, width = 16, lineW = 4) {
        super(partsName)
        this.x = x
        this.y = y
        this.width = width
        this.state = this.State.Hide
        this.lineW = lineW
//        console.log("x,y"+this.x+","+this.y)
    }

    serializeData(){
        return JSON.stringify({
            x: this.x,
            y: this.y,
            width: this.width,
            state: this.state,
            lineW: this.lineW,
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
        this.width = obj.width
        this.state = obj.state
        this.lineW = obj.lineW
        this.actState = obj.actState // 派生元クラスPartsActionの分
    }

    activate(isActive) {
        if (isActive === true) {
            // Redの場合は既にActiveのため変更しない
            if (this.state !== this.State.Red) {
                this.state = this.State.Black
            }
        } else {
            this.state = this.State.Hide
        }
    }

    changeState() {
        if (this.state === this.State.Hide) {
            this.state = this.State.Black
        } else {
            this.state = this.State.Hide
        }
    }

    changeSpecialState() {
        this.state = this.State.Red
    }

    changePos(x, y) {
        this.x = x
        this.y = y
    }

    getPos() {
        return [this.x, this.y]
    }

    movePos(x, y) {
        this.x = this.x + x
        this.y = this.y + y
    }

    getActDispPoints() {
        return {
            visible:this.state !== this.State.Hide,
            staPos: { x:this.x - this.width / 2, y:this.y - this.width / 2},
            endPos: { x:this.x + this.width / 2, y:this.y + this.width / 2},
        }
    }

    isHit(x, y) {
        if ((this.x - this.width / 2) <= x && x < (this.x + this.width / 2) && (this.y - this.width / 2) <= y && y < (this.y + this.width / 2)) {
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
        switch (this.state) {
            case this.State.Black:
            case this.State.Red:
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
        if (printing && this.state === this.State.Hide) {
            return
        }

        ctx.beginPath()
        ctx.setLineDash([])

        if (this.state === this.State.Red) {
            const ofstW = this.lineW * Math.sign(Math.PI/4)
            const center = {x:this.x, y:this.y}
            const adjustVal = 1.1; // 見た目をよくするための係数
            const leftTop = {x:this.x - adjustVal * this.width / 2, y:this.y - adjustVal * this.width / 2}
            const rightBtm = {x:this.x + adjustVal * this.width / 2, y:this.y + adjustVal * this.width / 2}

            ctx.lineWidth = 3
            ctx.fillStyle = "black"
            ctx.strokeStyle = "red"
            ctx.moveTo(leftTop.x + ofstW, leftTop.y)
            ctx.lineTo(center.x, center.y - ofstW)
            ctx.lineTo(rightBtm.x - ofstW, leftTop.y)
            ctx.lineTo(rightBtm.x, leftTop.y + ofstW)
            ctx.lineTo(center.x + ofstW, center.y)
            ctx.lineTo(rightBtm.x, rightBtm.y - ofstW)
            ctx.lineTo(rightBtm.x - ofstW, rightBtm.y)
            ctx.lineTo(center.x, center.y + ofstW)
            ctx.lineTo(leftTop.x + ofstW, rightBtm.y)
            ctx.lineTo(leftTop.x, rightBtm.y - ofstW)
            ctx.lineTo(center.x - ofstW, center.y)
            ctx.lineTo(leftTop.x, leftTop.y + ofstW)
            ctx.lineTo(leftTop.x + ofstW, leftTop.y)
            ctx.stroke()
            ctx.fill()
        }
        else {
            // console.log("x,y,state: "+this.x+","+this.y+","+this.state)
            if (this.state === this.State.Hide) {
                ctx.lineWidth = 1
                ctx.fillStyle = "white"
                ctx.strokeStyle = "gray"
                ctx.setLineDash([1,4])
            }
            else {
                ctx.lineWidth = 6
                ctx.fillStyle = "black"
                ctx.strokeStyle = "black"
            }

            ctx.moveTo(this.x - this.width / 2, this.y - this.width / 2)
            ctx.lineTo(this.x + this.width / 2, this.y + this.width / 2)
            ctx.moveTo(this.x - this.width / 2, this.y + this.width / 2)
            ctx.lineTo(this.x + this.width / 2, this.y - this.width / 2)
            ctx.stroke() 
        }
    }
}
export default MusicStand