import Seat from './Seat'
import MusicStand from './MusicStand'
import {
    calcPosFromLen,
    getRectfrom2pts,
    optimizeMusicStandsLayout,
    mergeActDispPoints
} from './util'
import {
    seatsArrangerInfo,
    cbLayerInfo,
    SimplePartsInfo
} from './data'
import AreaDivider from './AreaDivider'
import HistoryManager from './HistoryManager'
import CbLayer from './CbLayer'
import SimpleParts from './SimpleParts'

class SeatsArranger {
    static cbGroupId = 10

    constructor(seatsInfo, dispInfoCallbackFn = null) {
//        this.init()
        this.seatsInfoObj = seatsInfo
        this.dispInfoCalllbackFn = dispInfoCallbackFn
    }
    init() {
        this.canvas = null
        this.ctx = null
        this.seats2D = [];            // 座席の全情報
        this.tactPos = {x:0, y:0};    // 指揮者の位置(※譜面台の位置を決定するのに必要)
        this.musicStands2D = [];      // 譜面台の全情報（1列あたり 2 * 座席数 - 1  ※席と席の間にも一応配置していることに留意必要）
        this.selecting = false        //　矩形選択状態か否か
        this.selPos = [{x:0, y:0},{x:0, y:0}] // 矩形選択状態のときの開始位置と終了位置
        this.areaDivider = new AreaDivider()
        this.cbLayer = new CbLayer(cbLayerInfo, SeatsArranger.cbGroupId, ()=>this.update("CbLayer"))
        this.simplePartsList = []
        this.printing = false
        this.printingBefore1stDraw = false
        this.printingArea = null
        this.printingImg = null
        this.historyManager = new HistoryManager(dataObj => {
            // 履歴の復元
            this.seats2D.forEach((seats,row)=>{
                seats.forEach((seat,col)=>{
                    seat.deserializeData(dataObj.seats2DData[row][col])
                })
            })
            this.musicStands2D.forEach((musicStands,row)=>{
                musicStands.forEach((musicStand,col)=>{
                    musicStand.deserializeData(dataObj.musicStands2DData[row][col])
                })
            })
            this.areaDivider.deserializeData(dataObj.areaDividerData)
            this.cbLayer.deserializeData(dataObj.cbLayerData)
            this.simplePartsList.forEach((simpleParts,idx)=>{
                simpleParts.deserializeData(dataObj.simplePartsListData[idx])
            })

            if (this.dispInfoCalllbackFn !== null ) {
                this.dispInfoCalllbackFn(this.getDispInfo())
            }
        })
    }

    setCanvas(canvas) {
        this.init()
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")
        this.makeSeats(this.canvas.width, this.canvas.height)
    }
    // 作成関数
    // width:キャンバスの幅, height:キャンバスの高さ, customFunc:自作のシート作成関数を指定する場合は設定
    makeSeats(width, height, customFunc = null) {
        if (customFunc != null) {
            customFunc(width, height, this.tactPos, this.seats2D)
        }
        else {
            this.makeSeatsDefault(width, height, this.tactPos, this.seats2D)
        }

        // 譜面台の作成 
        this.makeMusicStands()

        // 領域分割屋の設定
        // ・位置
        this.areaDivider.setArea(10, 10, width-20, height-20)

        // シンプル部品の生成
        this.makeSimpleParts()

        // ・分割対象の設定
        this.areaDivider.registerDividing(this.seats2D, (divIdList, drawPosList2D, divInfos) => {
            console.log(divIdList)
            console.log(drawPosList2D)
            console.log(divInfos)

            // 譜面台配置の最適化
            this.optimizeMusicStandsLayout()

            this.update("areaDivider")
        })

        if (this.dispInfoCalllbackFn !== null ) {
            this.dispInfoCalllbackFn(this.getDispInfo())
        }
}

    // シート構成作成のデフォルト関数
    // [IN]width: キャンバスの幅
    // [IN]height: キャンバスの高さ
    // [OUT]tactPos: 指揮者の位置
    // [OUT]seats2D: シートの配置
    makeSeatsDefault(width, height, tactPos, seats2D) {
        const seatRadius = this.seatsInfoObj.seatRadius
        const distCenterLR = this.seatsInfoObj.distCenterLR
        const distSideLR = this.seatsInfoObj.distSideLR
        const ellipticity = this.seatsInfoObj.ellipticity
        const baseX = width / 2
        const baseY = height - 70
        this.seatsInfoObj.seatsCircles.forEach((seatCircle, row) => {
            // 座席一列ぶん（半円に近い形）
            const seats = []
            let distCF = seatCircle.distCF
            let numPart = seatCircle.num / 2 - 2
            let seatObj = null

            // 左右対称の片方ぶんのみの数が必要のため【2で割り】、1点は上記で固定表示するので分割には関係ないため減算で更にもう1点を分割数算出のために減算【合計2減算】
            // 半円の一番左側の下
            seatObj = new Seat(this.makePartsName("ST", row, 0), baseX - 0.5 * distCenterLR - distCF, baseY, seatRadius, 1)
            seatObj.registerCallback((partsName, state) => {this.seatUpdate(partsName)})
            seats.push(seatObj)

            // 半円の左側すべて
            for(let i = 0; i <= numPart; i++){
                seatObj = new Seat(this.makePartsName("ST", row, i+1), baseX - 0.5 * distCenterLR - distCF * Math.cos(0.5 * Math.PI * i / numPart), baseY - distSideLR - ellipticity * distCF * Math.sin(0.5 * Math.PI * i / numPart), seatRadius, 1)
                seatObj.registerCallback((partsName, state) => {this.seatUpdate(partsName)})
                seats.push(seatObj)
            }
            // 半円の右側すべて
            for(let i = numPart; i >= 0; i--){
                seatObj = new Seat(this.makePartsName("ST", row, (numPart+1)*2-i), baseX + 0.5 * distCenterLR + distCF * Math.cos(0.5 * Math.PI * i / numPart), baseY - distSideLR - ellipticity * distCF * Math.sin(0.5 * Math.PI * i / numPart), seatRadius, 1)
                seatObj.registerCallback((partsName, state) => {this.seatUpdate(partsName)})
                seats.push(seatObj)
            }
            // 半円の一番右側の下
            seatObj = new Seat(this.makePartsName("ST", row, (numPart+1)*2+1), baseX + 0.5 * distCenterLR + distCF, baseY, seatRadius, 1)
            seatObj.registerCallback((partsName, state) => {this.seatUpdate(partsName)})
            seats.push(seatObj)
            
            // 座席一列ぶんを全体格納領域へ登録
            seats2D.push(seats)

            // 座席一列ぶんの分割位置を保存（すべてfalseで分割無し状態）
            let splitIndexes = []
            seats.forEach(seat => splitIndexes.push(false))
        })
        
        // 指揮者の位置を少し上に移動する（譜面台の位置微調整のため）
        tactPos.x = baseX
        tactPos.y = baseY - 30
    }

    makeMusicStands() {
        this.seats2D.forEach((seats, row) => {
            const musicStands = []
            let msObj = null
            for (let col = 0; col < seats.length; col++){
                const [posX, posY] = seats[col].getPos()
                let [standX, standY] = calcPosFromLen(posX, posY, this.tactPos.x, this.tactPos.y, seatsArrangerInfo.distToStand)
                msObj = new MusicStand(this.makePartsName("MS", row, col*2), standX, standY)
                msObj.registerCallback((partsName, state) => {this.update(partsName)})
                musicStands.push(msObj)
                
                // まだ末端ではない場合
                if (col < seats.length - 1){
                    // 現在地と次の位置の間に譜面台を置く
                    let [nextX, nextY] = seats[col + 1].getPos()
                    let [standX, standY] = calcPosFromLen((posX + nextX)/2, (posY + nextY)/2, this.tactPos.x, this.tactPos.y, seatsArrangerInfo.distToStand)
                    msObj = new MusicStand(this.makePartsName("MS", row, col*2+1), standX, standY)
                    msObj.registerCallback((partsName, state) => {this.update(partsName)})
                    musicStands.push(msObj)
                } 
            }
            this.musicStands2D.push(musicStands)
        })
    }

    makeSimpleParts() {
        SimplePartsInfo.parts.forEach(partsInfo=>{
            const simpleParts = new SimpleParts(partsInfo.name, partsInfo.x, partsInfo.y, SimplePartsInfo.common.w, SimplePartsInfo.common.h, partsInfo.text, partsInfo.imgsrc)
            simpleParts.registerCallback((partsName, state) => {this.update(partsName)})
            this.simplePartsList.push(simpleParts)
        })
    }

    setSimplePartsVisible(partsName, visible) {
        const parts = this.simplePartsList.find((simpleParts)=>simpleParts.partsName === partsName)
        if (parts !== undefined) {
            parts.setVisible(visible)
        }
    }

    setPrintingMode(printing) {
        this.printing = printing
        if (this.printing) {
            this.printingImg = null
            this.printingBefore1stDraw = false
        } else {
            this.printingImg = null
        }
    }

    makePrintingImg() {
        const margin = 10
        const actDispPoints = this.getActDispPoints()
        if (actDispPoints.visible) {
            // マージンぶんを加味して対象領域を抽出
            actDispPoints.staPos.x = Math.max(0, actDispPoints.staPos.x - margin)
            actDispPoints.staPos.y = Math.max(0, actDispPoints.staPos.y - margin)
            actDispPoints.endPos.x = Math.min(this.canvas.width, actDispPoints.endPos.x + margin)
            actDispPoints.endPos.y = Math.min(this.canvas.height, actDispPoints.endPos.y + margin)
            // w,y,w,h形式へ変換
            this.printingArea = {
                x:actDispPoints.staPos.x,
                y:actDispPoints.staPos.y,
                w:actDispPoints.endPos.x - actDispPoints.staPos.x,
                h:actDispPoints.endPos.y - actDispPoints.staPos.y
            }
            const img = new Image()
            img.src = this.canvas.toDataURL()
            img.onload = ()=>{
                this.printingImg = img
            }
        }
    }

    optimizeMusicStandsLayout() {
        this.seats2D.forEach((seats, row) => {
        	optimizeMusicStandsLayout(seats, this.musicStands2D[row])
        })
    }
    makePartsName(uniqname,row,col) {
        return uniqname + "_" + row.toString() + "_" +col.toString()
    }

    // {numOfSeats: {1:xxx, 2:xxx,...}, numOfStands: {1:xxx, 2:xxx,...} }
    getDispInfo() {
        const numInfo = { numOfSeats:{}, numOfStands:{}}
        // 座席のグループごとの席数抽出
        this.seats2D.flat().filter(seat=>{ return seat.isExistence()}).forEach(seat=>{
            numInfo.numOfSeats[seat.groupId] = numInfo.numOfSeats[seat.groupId] === undefined? 1: numInfo.numOfSeats[seat.groupId]+1
            numInfo.numOfSeats.all = numInfo.numOfSeats.all === undefined? 1: numInfo.numOfSeats.all + 1
        })

        // 譜面台のグループごとの個数抽出
        this.musicStands2D.forEach((musicStands,row)=>{
            musicStands.forEach((musicStand,col)=>{
                if (musicStand.isExistence()) {
                    const groupId = this.seats2D[row][Math.floor(col / 2)].groupId
                    numInfo.numOfStands[groupId] = numInfo.numOfStands[groupId] === undefined? 1: numInfo.numOfStands[groupId]+1
                    numInfo.numOfStands.all = numInfo.numOfStands.all === undefined? 1: numInfo.numOfStands.all + 1
                }
            })
        })
        
        // コントラバスの席数・個数の抽出
        numInfo.numOfSeats[SeatsArranger.cbGroupId] = this.cbLayer.getNumOfSeats()
        numInfo.numOfSeats.all = numInfo.numOfSeats.all === undefined? 1: numInfo.numOfSeats.all + numInfo.numOfSeats[SeatsArranger.cbGroupId]

        numInfo.numOfStands[SeatsArranger.cbGroupId] = this.cbLayer.getNumOfStands()
        numInfo.numOfStands.all = numInfo.numOfStands.all === undefined? 1: numInfo.numOfStands.all + numInfo.numOfStands[SeatsArranger.cbGroupId]
        
        return numInfo
    }

    getActDispPoints() {
        return mergeActDispPoints([
            this.seats2D,
            this.musicStands2D,
            [this.cbLayer],
            this.simplePartsList])
    }

    onClick(x, y, event) {
        // 今は使用しない
    }
  
    onDoubleClick(x, y, event) {
        // 今は使用しない
    }
  
    onMouseDown(x, y, event) {
        if (this.areaDivider.isHit(x, y)) {
            if (event.ctrlKey) {
                // 分割線に対してselected/unselectedを更新した場合はここで処理終了                
                if (this.areaDivider.selectDivLinesFromPos(x, y, true) === true) {
                    return
                }
            }
        }

        if (this.cbLayer.isHit(x, y)) {
            this.cbLayer.onMouseDown(x, y, event)
            return
        }

        for (let idx = 0; idx < this.simplePartsList.length; idx++) {
            if(this.simplePartsList[idx].isHit(x, y) === true) {
                this.simplePartsList[idx].onMouseDown(x, y, event)
                return
            }
        }
        for (let row = 0; row < this.seats2D.length; row++) {
            for (let col = 0; col < this.seats2D[row].length; col++) {
                let seat = this.seats2D[row][col]
                if(seat.isHit(x, y) === true) {
                    if (event.ctrlKey) {
                        seat.selected = seat.selected? false: true
                    } else {
                        seat.onMouseDown(x, y, event)
                    }
                    return
                }
            }
        }
        for (let row = 0; row < this.musicStands2D.length; row++) {
            for (let col = 0; col < this.musicStands2D[row].length; col++) {
                let musicStand = this.musicStands2D[row][col]
                if(musicStand.isHit(x, y) === true) {
                    musicStand.onMouseDown(x, y, event)
                    return
                }
            }
        }

        // 矩形選択状態の更新
        if (event.ctrlKey) {
            this.selecting = true
            this.selPos[0].x = this.selPos[1].x = x
            this.selPos[0].y = this.selPos[1].y = y
        }
        else {
            this.selecting = false

            // 座席の選択状態をクリア
            this.seats2D.forEach( seats => {
                seats.forEach(seat => {
                    seat.selected = false
                })
            })
            // 領域分割の選択状態を解除
            this.areaDivider.cancelSelectedDivLines()

            this.areaDivider.onMouseDown(x, y, event)
        }
    }

    onMouseMove(x, y, event) {
        if (this.selecting === true) {
            if (event.ctrlKey) {
               this.selPos[1].x = x
               this.selPos[1].y = y
           } else {
               this.selecting = false
           }
        } else {
            this.cbLayer.onMouseMove(x, y, event)

            this.simplePartsList.forEach((simpleParts)=>{
                simpleParts.onMouseMove(x, y, event)
            })
            this.seats2D.forEach( seats => {
                seats.forEach(seat => {
                    seat.onMouseMove(x, y, event)
                })
            })
            this.musicStands2D.forEach( musicStands => {
                musicStands.forEach(musicStand => {
                    musicStand.onMouseMove(x, y, event)
                })
            })
    
            this.areaDivider.onMouseMove(x, y, event)
        }
    }
    
    onMouseUp(x, y, event) {
        this.cbLayer.onMouseUp(x, y, event)

        this.simplePartsList.forEach((simpleParts)=>{
            simpleParts.onMouseUp(x, y, event)
        })
        this.seats2D.forEach( seats => {
            seats.forEach(seat => {
                seat.onMouseUp(x, y, event)
            })
        })
        this.musicStands2D.forEach( musicStands => {
            musicStands.forEach(musicStand => {
                musicStand.onMouseUp(x, y, event)
            })
        })

        this.areaDivider.onMouseUp(x, y, event)

        if (this.selecting === true) {
            if (event.ctrlKey) {
               this.selPos[1].x = x
               this.selPos[1].y = y

                this.seats2D.forEach( seats => {
                    seats.forEach(seat => {
                        if (((this.selPos[0].x <= seat.x && seat.x <= this.selPos[1].x) || (this.selPos[1].x <= seat.x && seat.x <= this.selPos[0].x))
                            && ((this.selPos[0].y <= seat.y && seat.y <= this.selPos[1].y) || (this.selPos[1].y <= seat.y && seat.y <= this.selPos[0].y))
                        ) {
                            seat.selected = true
                        }
                    })
                })
                // 矩形選択領域に分割線の頂点のいずれかが含まれているなら選択状態にする
                const [x1, y1, w, h] = getRectfrom2pts(this.selPos[0].x, this.selPos[0].y, this.selPos[1].x, this.selPos[1].y)
                this.areaDivider.selectDivLinesFromRect(x1, y1, w, h)
           }
           this.selecting = false
        }
    }

    onMouseOut(event) {
        this.cbLayer.onMouseOut()

        this.areaDivider.onMouseOut()

        this.selecting = false
    }

    onKeyDown(event) {
        console.log(`key:${event.key}, ctrl:${event.ctrlKey}`)
        switch (event.key) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                // 選択状態の座席のgroupIdを変更する
                this.seats2D.forEach( seats => {
                    seats.forEach(seat => {
                        if (seat.selected === true) {
                            seat.selected = false
                            seat.groupId = Number(event.key)
                        }
                    })
                })

                this.seatUpdate("")
                break
            case " ":
            case "Delete":
                    // 選択状態の座席を隠す
                this.seats2D.forEach( seats => {
                    seats.forEach(seat => {
                        if (seat.selected === true) {
                            seat.selected = false
                            seat.hide()
                        }
                    })
                })
                // 選択状態の分割線を削除する
                this.areaDivider.deleteSelectedDivLines()

                this.seatUpdate("")
                break
            case "y":
                if (event.ctrlKey) {
                    this.historyManager.redo()
                }
                break
            case "z":
                if (event.ctrlKey) {
                    this.historyManager.undo()
                }
                break
            default:
                break
        }
    }

    onKeyUp(event) {
        // 今は何も使わない
    }

    setCbLayerVisible(visible) {
        this.cbLayer.setVisible(visible)
    }

    update(partsName) {
        // console.log("updated!:"+partsName)

        // 履歴を保存
        const seats2DData = []
        this.seats2D.forEach((seats,row)=>{
            seats2DData[row] = []
            seats.forEach((seat,col)=>{
                seats2DData[row][col] = seat.serializeData()
            })
        })
        
        const musicStands2DData = []
        this.musicStands2D.forEach((musicStands,row)=>{
            musicStands2DData[row] = []
            musicStands.forEach((musicStand,col)=>{
                musicStands2DData[row][col] = musicStand.serializeData()
            })
        })

        const simplePartsListData = []
        this.simplePartsList.forEach((simpleParts, idx)=>{
            simplePartsListData[idx] = simpleParts.serializeData()
        })

        this.historyManager.registerHistory({
            seats2DData : seats2DData,             
            musicStands2DData : musicStands2DData,
            areaDividerData : this.areaDivider.serializeData(),
            cbLayerData : this.cbLayer.serializeData(),
            simplePartsListData: simplePartsListData,
        })

        if (this.dispInfoCalllbackFn !== null ) {
            this.dispInfoCalllbackFn(this.getDispInfo())
        }
    }
    
    seatUpdate(partsName) {
        // 譜面台配置の最適化
        this.optimizeMusicStandsLayout()

        this.update(partsName)
    }
    draw() {
        const ctx = this.ctx

        // まず背景をクリア
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // 印刷用モードでCanvas全体イメージを抽出出来た場合
        if (this.printing && this.printingArea != null && this.printingImg !== null) {
            // キャンバス全体イメージから部分抽出してそれを広げて表示
            ctx.drawImage(
                this.printingImg,
                this.printingArea.x,
                this.printingArea.y,
                this.printingArea.w,
                this.printingArea.h,
                0,
                0,
                this.printingArea.w / this.printingArea.h > this.canvas.width / this.canvas.height ? this.printingArea.w * this.canvas.width / this.printingArea.w: this.printingArea.w * this.canvas.height / this.printingArea.h,
                this.printingArea.w / this.printingArea.h > this.canvas.width / this.canvas.height ? this.printingArea.h * this.canvas.width / this.printingArea.w: this.printingArea.h * this.canvas.height / this.printingArea.h
            )
            return
        }
    
        // 座席の描画
        this.seats2D.forEach( seats => {
            seats.forEach(seat => {
                seat.draw(ctx, this.printing)
            })
        })
        // 譜面台の描画
        this.musicStands2D.forEach( musicStands => {
            musicStands.forEach(musicStand => {
                musicStand.draw(ctx, this.printing)
            })
        })
        // 指揮者は矩形描画だけのためここで直接書く
        this.drawTact(ctx, this.printing)

        // 領域分割屋を描画
        this.areaDivider.draw(ctx, this.printing)

        // シンプル部品を描画
        this.simplePartsList.forEach((simpleParts)=>{
            simpleParts.draw(ctx, this.printing)
        })

        // Cb（コントラバスの）レイヤーを描画
        this.cbLayer.draw(ctx, this.printing)

        // 矩形選択ありなら矩形選択領域を表示
        if (this.selecting === true) {
            this.drawSelRect(ctx, this.printing)
        }
        if (this.printing && !this.printingBefore1stDraw) {
            this.printingBefore1stDraw = true
            this.makePrintingImg()
        }
    }
    drawTact(ctx, printing = false) {
        ctx.beginPath()
        ctx.setLineDash([])
        ctx.strokeStyle = "black"
        ctx.fillStyle = "white"
        ctx.lineWidth = 4
        const w = seatsArrangerInfo.tactWH.w
        const h = seatsArrangerInfo.tactWH.h
        ctx.strokeRect(this.tactPos.x - w / 2, this.tactPos.y - h / 2, w, h)
    }
    drawSelRect(ctx, printing = false) {
        // 印刷時表示なら描画しない
        if (printing) {
            return
        }
        ctx.beginPath()
        ctx.setLineDash([1,3])
        ctx.strokeStyle = "rgb(100, 76, 76)"
        ctx.lineWidth = 3
        const [x, y, w, h] = getRectfrom2pts(this.selPos[0].x, this.selPos[0].y, this.selPos[1].x, this.selPos[1].y)
        ctx.strokeRect(x, y, w, h)
    }

    end(){
        // console.log("end!!")
    }
}

export default SeatsArranger