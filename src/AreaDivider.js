import {calcLenRadFromPos, getRotRelPos} from './util'
class AreaDivider {
    static GROUP_ID_MAX = 9 // 設定するグループIDの最大値(10はCb用としているため9に設定)
    StateKind = {
        Idle: "I",
        Dividing: "D",
    }

    DividedAreaState = {
        NoHit: "NH",
        InHit: "IH",
        OutHit: "OH",
        In2OutHit: "IO",
        Out2InHit: "OI",
    }

    constructor() {
        this.positions = []
        this.objects2D = []
        this.divIdList = []; // devIdのバリエーションリスト
        this.divInfos = []
        this.drawPosList2D = []
        this.rect = {x:0, y:0, w:0, h:0}
        this.callbackFn = null
        this.state = this.StateKind.Idle
        this.dividedAreas2D = []; // objects2D[y][x]とするとdivideAreas[y][x+1]となる
        this.clearCurDivInfo()
    }

    serializeData(){
        const jsonStr = JSON.stringify({
            divIdList: this.divIdList,
            divInfos: this.divInfos,
            drawPosList2D: this.drawPosList2D,
            rect: this.rect,
            dividedAreas2D: this.dividedAreas2D,
        })
        return jsonStr
    }

    deserializeData(serializedData){
        try{
          var obj = JSON.parse(serializedData)
        }catch(e){
          /// エラー時の処理
          console.e('Failed to parse json')
          return
        }
        this.divIdList = obj.divIdList
        this.divInfos = obj.divInfos
        this.drawPosList2D = obj.drawPosList2D
        this.rect = obj.rect
        this.dividedAreas2D = obj.dividedAreas2D

        this.clearDividedAreaStatus()
    }

    clearCurDivInfo() {
        this.curDivInfo = {divList:[], isCompleted:false, isLooped:false, isSelected:false}; // divListは{col:xxx, row:xxx, stt:this.DividedAreaState.xxx} を保持する配列
    }
    
    getUnusedGgroupId() {
        for (let i = 1; i < AreaDivider.GROUP_ID_MAX; i++) {
            let j = 0
            for (; j < this.divIdList.length; j++) {
                if (i === this.divIdList[j]) {
                    break
                }
            }
            // 既にdevIdListに存在する場合はiを1つ進めて再度存在チェック
            if (j < this.divIdList.length) {
                continue
            }
            return i    
        }
        return AreaDivider.GROUP_ID_MAX
    }

    // groupIdを更新する
    updateGroupId() {
        // 次に設定すべきdivIdの決定（divIdListの末尾が現在のIDの最大値なので、それに1を足した値が基本
        let nextDivId = this.getUnusedGgroupId()
        let isUpdate = false
        for (let row = 0; row < this.objects2D.length; row++) {
            let divPoints = []
            this.curDivInfo.divList.forEach(div => {
                if (row === div.row) {
                    divPoints.push(div.col)
                }
            })
            divPoints.sort((a,b)=>{return a-b})
            let startCol = divPoints[0]
            let endCol = 0; //仮置き（デフォルトは分割しない）
            if (divPoints.length === 1) {
                for (let col = startCol; col < this.objects2D[row].length; col++) {
                    if (col > 0 && (this.objects2D[row][col-1].groupId !== this.objects2D[row][col].groupId)) {
                        break
                    }
                    else {
                        endCol = col
                    }
                }
            } else if (divPoints.length >= 2) {
                endCol = Math.min(divPoints[1] - 1, this.objects2D[row].length - 1)
            }
            for (let col = startCol; col <= endCol; col++) {
                this.objects2D[row][col].groupId = nextDivId
                isUpdate = true
            }
        }
        if (isUpdate === true) {
            // divIdListを更新する
            this.divIdList.push(nextDivId)
        }
    }

    // 分割線を挟むgroupIdを共通化する
    commonizeGroupId(idx) {
        // 分割線を挟むgroupIdの中で一番小さい値を抽出
        let minId = AreaDivider.GROUP_ID_MAX
        this.divInfos[idx].divList.forEach(div => {
            if (div.col > 0) {
                minId = Math.min(minId, this.objects2D[div.row][div.col-1].groupId)
            }
            minId = Math.min(minId, this.objects2D[div.row][div.col].groupId)
        })
        // 一番小さい値を抽出出来た
        if (minId < AreaDivider.GROUP_ID_MAX) {
            // 各行ごとに処理
            for (let row = 0; row < this.objects2D.length; row++) {
                // 行中に含まれる分割線を割り出し
                let divPoints = []
                this.divInfos[idx].divList.forEach(div => {
                    if (row === div.row) {
                        divPoints.push(div.col)
                    }
                })
                divPoints.sort((a,b)=>{return a-b})
//                let startCol = divPoints[0]
//                let endCol = 0; //仮置き（デフォルトは分割しない）
                if (divPoints.length === 1) {
                    //分割線より左（手前）を更新
                    if (divPoints[0] > 0) {
                        // 現在の値は別途保持させて最小値で更新
                        const curGroupId = this.objects2D[row][divPoints[0]-1].groupId
                        this.objects2D[row][divPoints[0]-1].groupId = minId
                        for (let col = divPoints[0] - 2; col >= 0; col--) {
                            if (this.objects2D[row][col].groupId !== curGroupId) {
                                break
                            }
                            else {
                                this.objects2D[row][col].groupId = minId
                            }
                        }
                    }
                    //分割線より右（後ろ）を更新
                    if (divPoints[0] < this.objects2D[row].length) {
                        // 現在の値は別途保持させて最小値で更新
                        const curGroupId = this.objects2D[row][divPoints[0]].groupId
                        this.objects2D[row][divPoints[0]].groupId = minId
                        for (let col = divPoints[0] + 1; col < this.objects2D[row].length; col++) {
                            if (this.objects2D[row][col].groupId !== curGroupId) {
                                break
                            }
                            else {
                                this.objects2D[row][col].groupId = minId
                            }
                        }
                    }
                } else if (divPoints.length >= 2) {
                    //1本目の分割線より左（手前）を更新
                    if (divPoints[0] > 0) {
                        // 現在の値は別途保持させて最小値で更新
                        const curGroupId = this.objects2D[row][divPoints[0]-1].groupId
                        this.objects2D[row][divPoints[0]-1].groupId = minId
                        for (let col = divPoints[0] - 2; col >= 0; col--) {
                            if (this.objects2D[row][col].groupId !== curGroupId) {
                                break
                            }
                            else {
                                this.objects2D[row][col].groupId = minId
                            }
                        }
                    }
                    //1本目と2本目の分割線の間を更新
                    for (let col = divPoints[0]; col < divPoints[1]; col++) {
                        this.objects2D[row][col].groupId = minId
                    }
                    //2本目の分割線より右（後ろ）を更新
                    if (divPoints[1] < this.objects2D[row].length) {
                        // 現在の値は別途保持させて最小値で更新
                        const curGroupId = this.objects2D[row][divPoints[1]].groupId
                        this.objects2D[row][divPoints[1]].groupId = minId
                        for (let col = divPoints[1] + 1; col < this.objects2D[row].length; col++) {
                            if (this.objects2D[row][col].groupId !== curGroupId) {
                                break
                            }
                            else {
                                this.objects2D[row][col].groupId = minId
                            }
                        }
                    }
                }
            }

            // divIdListを更新する
            this.updateDivIdList()
        }
    }

    makeDrawPosList() {
        let drawPosList = []
        for (let i = 0; i < this.curDivInfo.divList.length; i++) {
            let dividedArea = this.dividedAreas2D[this.curDivInfo.divList[i].row][this.curDivInfo.divList[i].col]
            if (dividedArea.stt === this.DividedAreaState.In2OutHit) {
                drawPosList.push(dividedArea.iDvP)
                drawPosList.push(dividedArea.oDvP)
            } else if (dividedArea.stt === this.DividedAreaState.Out2InHit) {
                drawPosList.push(dividedArea.oDvP)
                drawPosList.push(dividedArea.iDvP)
            }
        }
        if (this.curDivInfo.isLooped === true && drawPosList.length > 0) {
            drawPosList.push(drawPosList[0])
        }
        return drawPosList
    }

    transitToIdle() {
        this.positions = []
        this.stt = this.StateKind.Idle
    }
    
    setArea(x, y, w, h) {
        this.rect = {x:parseInt(x), y:parseInt(y), w:parseInt(w), h:parseInt(h)}
    }

    registerDividing(objects2D, callbackFn) {
        // ※オブジェクト:object2D[i][j] の手前の位置の分割状態は　dividedAreas2D[i][j]
        this.objects2D = objects2D
        this.dividedAreas2D = []
        this.callbackFn = callbackFn
        this.divInfos = []
        this.clearCurDivInfo()
        for(let i = 0; i < objects2D.length; i++) {
            let dividedAreas = []
            for(let j = 0; j < objects2D[i].length + 1; j++) { // objects2D[i]の要素数よりも1多く回ることに注意
                let [x1 ,x2, y1, y2, r] = [0, 0, 0, 0, 0]
                if (j === 0) {
                    // 列先頭の開始点は、１番最初のオブジェクトの位置から、１～２番目の位置の変化量を逆に引いた箇所
                    x1 = 2 * objects2D[i][j].x - objects2D[i][j+1].x
                    y1 = 2 * objects2D[i][j].y - objects2D[i][j+1].y
                    // 列先頭の終了点は、１番最初のオブジェクトの位置
                    x2 = objects2D[i][j].x
                    y2 = objects2D[i][j].y
                    r = objects2D[i][j].radius
                } else if (j >= objects2D[i].length) {
                    // 列末端の開始点は、一番最後のオブジェクトの位置
                    x1 = objects2D[i][j-1].x
                    y1 = objects2D[i][j-1].y
                    // 列末端の終了点は、１番末端のオブジェクトの位置から、末端１つ手前～末端の位置の変化量を足した箇所
                    x2 = 2 * objects2D[i][j-1].x - objects2D[i][j-2].x
                    y2 = 2 * objects2D[i][j-1].y - objects2D[i][j-2].y
                    r = objects2D[i][j-1].radius
                } else {
                    x1 = objects2D[i][j-1].x
                    y1 = objects2D[i][j-1].y
                    x2 = objects2D[i][j].x
                    y2 = objects2D[i][j].y
                    r = objects2D[i][j-1].radius
                }
                x1 = parseInt(x1)
                y1 = parseInt(y1)
                x2 = parseInt(x2)
                y2 = parseInt(y2)
                r = parseInt(r)

                let objLenRadian = calcLenRadFromPos(x1, y1, x2, y2)
                
                let centerPos = {x:parseInt((x2 + x1) / 2), y:parseInt((y2 + y1) / 2)};        // 範囲を表す2点の中点をcenterPosとする
                let relStartPos = {x:x1 - centerPos.x, y:y1 - centerPos.y} // startPosのcenterPosからの相対x座標
                let relEndPos = {x:x2 - centerPos.x, y:y2 - centerPos.y} //　startPosのcenterPosからの相対y座標

                let dividedArea = {
                    sPs:{x:x1, y:y1},
                    ePs:{x:x2, y:y2},
                    len:parseInt(objLenRadian.len),
//                    radian:objLenRadian.radian,
//                    r:r,
                    iDvP: {x:relStartPos.y + centerPos.x, y:- relStartPos.x + centerPos.y}, // (startPosの相対x座標をcenterPosを中心に90度反時計回りに回転)
                    oDvP:{x:relEndPos.y + centerPos.x, y:- relEndPos.x + centerPos.y},　// (endPosの相対x座標をcenterPosを中心に90度反時計回りに回転)
                    stt:this.DividedAreaState.NoHit,
                }
                dividedAreas.push(dividedArea)
            }
            this.dividedAreas2D.push(dividedAreas)

        }

        this.updateDivIdList()

        if (this.callbackFn !== null) {
            this.callbackFn(this.divIdList, this.drawPosList2D, this.divInfos)
        }
    }

    updateDivIdList() {
        const divIdSet = new Set()
        for(let i = 0; i < this.objects2D.length; i++) {
            for(let j = 0; j < this.objects2D[i].length; j++) {
                divIdSet.add(this.objects2D[i][j].groupId)
            }
        }
        this.divIdList = Array.from(divIdSet)
    }

    isHit(x, y) {
        if (this.rect.x <= x && x < this.rect.x + this.rect.w && this.rect.y <= y && y < this.rect.y + this.rect.h) {
            return true
       }
       return false
    }

    selectDivLinesFromRect(x, y, w, h) {
        const hittedDivLines = []
        for(let i = 0; i < this.drawPosList2D.length; i++) {
            for(let j = 0; j < this.drawPosList2D[i].length; j++) {
                if (x <= this.drawPosList2D[i][j].x && this.drawPosList2D[i][j].x < x + w && y <= this.drawPosList2D[i][j].y && this.drawPosList2D[i][j].y < y + h) {
                    hittedDivLines.push(i)
                    break
                }
            }
        }
        hittedDivLines.forEach(Id=>{
            this.divInfos[Id].isSelected = true
        })

        return hittedDivLines.length > 0? true: false
    }

    // ※toggle === trueの場合、selected->unselected/unselected->selected と変更する 
    selectDivLinesFromPos(x, y, toggle = false) {
        const r = 15
        const hittedDivLines = []
        for(let i = 0; i < this.drawPosList2D.length; i++) {
            for(let j = 0; j < this.drawPosList2D[i].length; j++) {
                if (Math.pow(this.drawPosList2D[i][j].x - x, 2) + Math.pow(this.drawPosList2D[i][j].y - y, 2) <= Math.pow(r, 2)) {
                    hittedDivLines.push(i)
                    break
                }
            }
        }
        hittedDivLines.forEach(Id=>{
            if (toggle === true) {
                this.divInfos[Id].isSelected = this.divInfos[Id].isSelected ? false: true
            } else {
                this.divInfos[Id].isSelected = true
            }
        })

        return hittedDivLines.length > 0? true: false

    }

    cancelSelectedDivLines() {
        this.divInfos.forEach(divInfo=>{
            divInfo.isSelected = false
        })
    }

    deleteSelectedDivLines() {
        // 選択状態の分割線のインデックスを配列に格納
        const targetDivLines = []
        this.divInfos.forEach((divInfo, idx)=>{
            if (divInfo.isSelected === true) {
                targetDivLines.push(idx)
            }
        })
        // 配列を大きいもの順にソート
        const sortedDivLinesArray = targetDivLines.sort( function(a,b) {
            return b - a
        } )
        // 選択状態の分割線を後ろから処理
        sortedDivLinesArray.forEach(idx=>{
            // 削除する分割線の前後でgroupIdを共通化する
            this.commonizeGroupId(idx)

            // 情報配列・位置リストともに削除を実行
            this.divInfos.splice(idx, 1)
            this.drawPosList2D.splice(idx, 1)
        })
    }

    getWhichDividedArea(dividedArea, x, y) {
        let dividedAreaStatus = this.DividedAreaState.NoHit
        let [ofsX, ofsY] = getRotRelPos(x, y
                                , dividedArea.sPs.x, dividedArea.sPs.y
                                , - Math.atan2(dividedArea.ePs.y - dividedArea.sPs.y, dividedArea.ePs.x - dividedArea.sPs.x)); // startPosに平行になるように(時計回りで)回転させたstartPosからの相対位置の取得
        if (0 <= ofsX && ofsX < dividedArea.len) {
//          if (0 <= ofsY && ofsY < dividedArea.r) {
            if (0 <= ofsY && ofsY < dividedArea.len/2) {
                dividedAreaStatus = this.DividedAreaState.InHit
//          } else if (- dividedArea.r <= ofsY && ofsY < 0) {
            } else if (- dividedArea.len/2 <= ofsY && ofsY < 0) {
                dividedAreaStatus = this.DividedAreaState.OutHit
            }
        }
        return dividedAreaStatus
    }

    // 各dividedAreaの更新をおこなう
    updateDividedAreaStatus(x, y) {
        let isChanged
        // 既に領域選定完了している場合は何もしない
        if (this.curDivInfo.isCompleted === true) {
            return
        }
        this.dividedAreas2D.forEach((dividedAreas, row) => {
            dividedAreas.forEach((dividedArea, col) => {
                let whichDividedArea = this.getWhichDividedArea(dividedArea, x, y)
                if (dividedArea.stt === this.DividedAreaState.InHit) {
                    if (whichDividedArea === this.DividedAreaState.InHit){
                        // 変化なし
                    }else if (whichDividedArea === this.DividedAreaState.OutHit) {
                        dividedArea.stt = this.DividedAreaState.In2OutHit
                        this.curDivInfo.divList.push({col:col, row:row, stt:this.DividedAreaState.In2OutHit})
                        // console.log(this.curDivInfo.divList[this.curDivInfo.divList.length-1])
                        isChanged = true
                    } else {
                        dividedArea.stt = this.DividedAreaState.NoHit
                        // console.log(dividedArea.stt)
                        isChanged = true
                    }   
                } else if (dividedArea.stt === this.DividedAreaState.OutHit) {
                    if (whichDividedArea === this.DividedAreaState.InHit){
                        dividedArea.stt = this.DividedAreaState.Out2InHit
                        this.curDivInfo.divList.push({col:col, row:row, stt:this.DividedAreaState.Out2InHit})
                        // console.log(this.curDivInfo.divList[this.curDivInfo.divList.length-1])
                        isChanged = true
                    }else if (whichDividedArea === this.DividedAreaState.OutHit) {
                        // 変化なし
                    } else {
                        dividedArea.stt = this.DividedAreaState.NoHit
                        // console.log(dividedArea.stt)
                        isChanged = true
                    }
                } else if (dividedArea.stt === this.DividedAreaState.In2OutHit) {
                    if (whichDividedArea === this.DividedAreaState.InHit){
                        let len = this.curDivInfo.divList.length
                        // 2個以上を含む分割領域の先頭にまた入ってきた（ループ状態）
                        if (len >= 2 && this.curDivInfo.divList[0].col === col && this.curDivInfo.divList[0].row === row) {
                            this.curDivInfo.isLooped = true
                            this.curDivInfo.isCompleted = true
                            // console.log("Looped and Completed row:"+row+",col:"+col)
                        }
                        else if (len >= 1 && this.curDivInfo.divList[len-1].col === col && this.curDivInfo.divList[len-1].row === row) {
                            this.curDivInfo.divList.pop()
                            dividedArea.stt = this.DividedAreaState.InHit
                            // console.log(this.curDivInfo.divList.pop)
                        }
                        else {
//                            console.log("error: In2OutHit to InHit, but invalid stt. row:"+row+",col:"+col)
                        }
                        isChanged = true
                    }else if (whichDividedArea === this.DividedAreaState.OutHit) {
                        // 変化なし
                    } else {
                        // 変化なし
                    }
                } else if (dividedArea.stt === this.DividedAreaState.Out2InHit) {
                    if (whichDividedArea === this.DividedAreaState.InHit){
                        // 変化なし
                    }else if (whichDividedArea === this.DividedAreaState.OutHit) {
                        let len = this.curDivInfo.divList.length
                        // 2個以上を含む分割領域の先頭にまた入ってきた（ループ状態）
                        if (len >= 2 && this.curDivInfo.divList[0].col === col && this.curDivInfo.divList[0].row === row) {
                            this.curDivInfo.isLooped = true
                            this.curDivInfo.isCompleted = true
                        }
                        else if (len >= 1 && this.curDivInfo.divList[len-1].col === col && this.curDivInfo.divList[len-1].row === row) {
                            this.curDivInfo.divList.pop()
                            dividedArea.stt = this.DividedAreaState.OutHit
                        }
//                        console.log("error: In2OutHit to InHit, but invalid stt. row:"+row+",col:"+col)
                        isChanged = true
                    } else {
                        // 変化なし
                    }
                } else {
                    if (whichDividedArea === this.DividedAreaState.InHit){
                        dividedArea.stt = this.DividedAreaState.InHit
                        // console.log("InHit row:"+row+",col:"+col)
                        isChanged = true
                    }else if (whichDividedArea === this.DividedAreaState.OutHit) {
                        dividedArea.stt = this.DividedAreaState.OutHit
                        // console.log("OutHit row:"+row+",col:"+col)
                        isChanged = true
                    } else {
                        // 変化なし
                    }
               }
               // 何かしらヒットしたなら処理終了
               if (isChanged){
                    return
               }
            })
        })
    }

    // 各dividedAreaの更新を完了させる
    completeDividedAreaStatus() {
        this.curDivInfo.isCompleted = true
        if (this.isValidDivInf(this.curDivInfo.divList) === true) {
            this.updateGroupId()
            this.drawPosList2D.push(this.makeDrawPosList())
            this.divInfos.push({...this.curDivInfo}) // 浅いコピーで対応
            if (this.callbackFn !== null) {
                this.callbackFn(this.divIdList, this.drawPosList2D, this.divInfos)
            }
        }
        this.clearDividedAreaStatus()
    }

    clearDividedAreaStatus() {
        this.dividedAreas2D.forEach(dividedAreas => {
            dividedAreas.forEach(dividedArea => {
                dividedArea.stt = this.DividedAreaState.NoHit
            })
        })
        this.clearCurDivInfo()
    }

    // 各dividedAreaの検証をおこなう
    isValidDivInf(divList) {
        // 1個以上登録されている事が最低条件
        if (divList.length >= 1) {
            let i = 0
            for (; i < divList.length - 1; i++) {
                if (divList[i].stt === this.DividedAreaState.In2OutHit) {
                    if (( divList[i].row      === divList[i+1].row && divList[i+1].stt === this.DividedAreaState.Out2InHit)
                    ||  ((divList[i].row + 1) === divList[i+1].row && divList[i+1].stt === this.DividedAreaState.In2OutHit)) {
                        continue
                    } else {
                        break
                    }
                } else if (divList[i].stt === this.DividedAreaState.Out2InHit) {
                    if (( divList[i].row      === divList[i+1].row && divList[i+1].stt === this.DividedAreaState.In2OutHit)
                    ||  ((divList[i].row - 1) === divList[i+1].row && divList[i+1].stt === this.DividedAreaState.Out2InHit)) {
                        continue
                    } else {
                        break
                    }
                }
                else {
                    break
                }
            }
            // つながり上はOK
            if (i >= divList.length - 1) {
                return true
            }
        }
        return false
    }

    onMouseDown(x, y, event) {
        if (this.object2D !== null) {
            this.positions = [{x:x,y:y}]
            this.stt = this.StateKind.Dividing
            this.clearDividedAreaStatus()
            this.updateDividedAreaStatus(x, y)
        }
    }

    onMouseMove(x, y, event) {
        if (this.stt === this.StateKind.Dividing) {
            if (this.isHit(x, y) === true) {
                this.positions.push({x:x,y:y})
                if (this.object2D !== null) {
                    this.updateDividedAreaStatus(x, y)
                }
            }
            else {
                // this.transitToIdle()
                // if (this.object2D !== null) {
                //     this.clearDividedAreaStatus()
                // }
                this.completeDividedAreaStatus()
            }
        }
    }

    onMouseUp(x, y, event) {
        if (this.stt === this.StateKind.Dividing) {
            if (this.object2D !== null) {
                this.completeDividedAreaStatus()
            }
        }
        this.transitToIdle()
    }

    onMouseOut() {
        this.transitToIdle()
        if (this.object2D !== null) {
            this.clearDividedAreaStatus()
        }
    }
    
    draw(ctx, printing = false) {
        // 背景の領域線は非印刷時のみ表示
        if (!printing) {
            ctx.beginPath()
            ctx.setLineDash([])
            ctx.fillStyle = "rgba(0,0,255,0.3)"
            ctx.strokeStyle = "rgb(88, 89, 98)"
            ctx.lineWidth = 2
            ctx.strokeRect(this.rect.x,this.rect.y,this.rect.w,this.rect.h)
            ctx.stroke()
        }

        if (this.stt === this.StateKind.Dividing) {
            ctx.beginPath()
            ctx.setLineDash([1,3])
            ctx.strokeStyle = "rgb(144, 171, 114)"
            ctx.lineWidth = 8
            ctx.moveTo(this.positions[0].x, this.positions[0].y)
            for (let i = 1; i < this.positions.length; i++) {
                ctx.lineTo(this.positions[i].x, this.positions[i].y)
            }
            ctx.stroke()
        }

        // 確定済みの分割線を表示
        this.drawPosList2D.forEach((drawPosList, idx)=>{
            // 選択状態の場合は選択色が見えるようにする
            if (this.divInfos[idx].isSelected === true) {
                ctx.beginPath()
                ctx.setLineDash([])
                ctx.strokeStyle = "rgb(239, 144, 89)"
                ctx.lineWidth = 7
                if (drawPosList.length > 0) {
                    ctx.moveTo(drawPosList[0].x, drawPosList[0].y)
                    for (let i = 1; i < drawPosList.length; i++) {
                        ctx.lineTo(drawPosList[i].x, drawPosList[i].y)
                    }
                }
                ctx.stroke()
            }
            ctx.beginPath()
            ctx.setLineDash([])
            ctx.strokeStyle = "black"
            ctx.lineWidth = 3
            if (drawPosList.length > 0) {
                ctx.moveTo(drawPosList[0].x, drawPosList[0].y)
                for (let i = 1; i < drawPosList.length; i++) {
                    ctx.lineTo(drawPosList[i].x, drawPosList[i].y)
                }
            }
            ctx.stroke()
        }) 
    }
}
export default AreaDivider