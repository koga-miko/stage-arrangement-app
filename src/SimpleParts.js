import PartsAction from './PartsAction'
import {drawsq} from './util'

class SimpleParts extends PartsAction {
    constructor(partsName, x, y, w, h, text = "", imgsrc = null) {
        super(partsName, true) // 移動のみ指定あり
        this.visible = false
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.text = text
        this.isImgLoaded = false
        if (imgsrc !== null) {
            this.img = new Image();
            this.img.src = imgsrc;
            this.img.onload = ()=>{
                this.isImgLoaded = true
            }
        } else {
            this.img = null
        }
    }

    serializeData(){
        return JSON.stringify({
            visible: this.visible,
            x: this.x,
            y: this.y,
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
        this.visible = obj.visible
        this.x = obj.x
        this.y = obj.y
        this.actState = obj.actState // 派生元クラスPartsActionの分
    }

    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible
            this.update()
        }
    }

    changePos(x, y) {
        this.x = x
        this.y = y
    }

    getPos() {
        return [this.x, this.y]
    }

    getActDispPoints() {
        return {
            visible:this.visible,
            staPos: { x:this.x, y:this.y},
            endPos: { x:this.x + this.w, y:this.y + this.h},
        }
    }

    isHit(x, y) {
       if (this.visible && this.x <= x && x < this.x + this.w && this.y <= y && y < this.y + this.h) {
           return true
       }
       return false
    }
    
    draw(ctx, printing = false) {
        if (!this.visible) {
            return
        }
        if (this.img !== null) {
            if (this.isImgLoaded === true) {
                // 画像イメージの表示
                ctx.drawImage(this.img, this.x, this.y)
            }
        } else {
            // 背景の表示
            drawsq(ctx, this.x, this.y, this.w, this.h, 10, "rgb(69, 16, 16)", "rgb(168, 100, 100)")
            // テキストの表示
            ctx.beginPath()
            ctx.font = "32pt 'Arial'"
            ctx.fillStyle = "white"
            ctx.textAlign = "center"
            ctx.fillText(this.text, this.x + (this.w/2), this.y + this.h/2 + 15)
            ctx.fill()
        }
    }
 
}

export default SimpleParts