// 座席から指揮者へ向かってlenの距離にある座標[x,y]を返す
export const calcPosFromLen = (srcX, srcY, dstX, dstY, len) => {
    if (len === 0) {
        return [0, 0]
    }
    const radian = Math.atan2((dstY - srcY),(dstX - srcX))
    return [srcX + Math.cos(radian) * len, srcY + Math.sin(radian) * len]
}

// srcからdstへの距離と角度を持つオブジェクト{len:xxx, radian:xxx}を返す
export const calcLenRadFromPos = (srcX, srcY, dstX, dstY) => {
    const dx = dstX - srcX
    const dy = dstY - srcY
    return {
        len: Math.pow( Math.pow(dx, 2) + Math.pow(dy, 2), 0.5),
        radian: Math.atan2(dy, dx),
    }
}

// centerを中心にtargetをradian回転させた場合の、centerからの相対位置[x, y]を返す
export const getRotRelPos = (targetX, targetY, centerX, centerY, radian) => {
    let ofsX = targetX - centerX
    let ofsY = targetY - centerY
    let ofsRotX = ofsX * Math.cos(radian) - ofsY * Math.sin(radian)
    let ofsRotY = ofsX * Math.sin(radian) + ofsY * Math.cos(radian)
    return [ofsRotX, ofsRotY]
}

// centerを中心にtargetをradian回転させた場合の、絶対位置を{x:***, y:***}形式のオブジェクトで返す
export const getRotAbsPos = (targetX, targetY, centerX, centerY, radian) => {
    let ofsX = targetX - centerX
    let ofsY = targetY - centerY
    let ofsRotX = ofsX * Math.cos(radian) - ofsY * Math.sin(radian)
    let ofsRotY = ofsX * Math.sin(radian) + ofsY * Math.cos(radian)
    return {x:ofsRotX + centerX, y:ofsRotY + centerY}
}

export const getRectfrom2pts = (x1, y1, x2, y2) => {
    const x = x1 < x2 ? x1: x2
    const w = (x2 - x1) > 0? x2 - x1: x1 - x2
    const y = y1 < y2 ? y1: y2
    const h = (y2 - y1) > 0? y2 - y1: y1 - y2
    return [x,y,w,h]
}

// 座席の行を分割する(分割されたIdx配列の配列を返す) ※引数はisExistence,groupIdをメソッドにもつオブジェクトの配列であればOK
const splitSeatsRow = (seats) => {
    const rowArray = []
    let isCreating = false; // 必ずfalseから始めること
    let splitedList = []
    for(let i = 0; i < seats.length; i++) {
        if (isCreating === false) {
            if (seats[i].isExistence()) {
                splitedList = [i]
                isCreating = true
                }
        } else {
            // 連続して存在かつ分割IDが同じ
            if ((seats[i].isExistence() === true) && (seats[i-1].groupId === seats[i].groupId)) {
                splitedList.push(i)
            } else {
                rowArray.push(splitedList)
                isCreating = false
                i--
            }
        }
    }
    if (isCreating === true) {
        rowArray.push(splitedList)
    }
    return rowArray
}

export const optimizeMusicStandsLayout = (seats, musicStands) => {
    // 譜面台を一旦すべて非アクティブで初期化col
    musicStands.forEach(musicStand => {
        musicStand.activate(false)
    })
    // 行をグループで分割
    let rowArray = splitSeatsRow(seats)
    for(let i = 0; i < rowArray.length; i++) {
        // 先頭よりのグループ　※先頭から譜面台計算する
        if (rowArray[i][0] < ((seats.length - 1) - rowArray[i][rowArray[i].length - 1]))
        {
            for(let j = 0; j < rowArray[i].length; j++){
                if ((rowArray[i].length >= 2)
                    && (j < rowArray[i].length - 1)
                    ) {
                    musicStands[2 * rowArray[i][j] + 1].activate(true)
                    j++
                } else {
                    musicStands[2 * rowArray[i][j]].activate(true)
                }
            }
        } else {
            for(let j = rowArray[i].length - 1; j >= 0; j--){
                if ((rowArray[i].length >= 2)
                    && (j > 0)
                    ) {
                    musicStands[2 * rowArray[i][j] - 1].activate(true)
                    j--
                } else {
                    musicStands[2 * rowArray[i][j]].activate(true)
                }
            }
        }
    }
}

export const isHitPolygon = (x, y, vertexPositions) => {
    // 引数不正チェック
    if (vertexPositions.length < 3) {
        return false
    }
    // ここから処理
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    let a = 0 // 傾き
    let b = 0 // Y切片

    let i = 0
    let crossCnt = 0
    // 多角形の各辺ごとに処理する
    // 該当(x,y)からY軸プラス方向に延びる半直線と各辺との交点の数が奇数ならヒットしていると判断できる
    for (; i < vertexPositions.length; i++) {
        x1 = vertexPositions[i].x
        y1 = vertexPositions[i].y
        if (i < vertexPositions.length - 1) {
            x2 = vertexPositions[i+1].x
            y2 = vertexPositions[i+1].y
        } else {
            x2 = vertexPositions[0].x
            y2 = vertexPositions[0].y
        }
        // Y軸と並行
        if (x1 === x2) {
            // 比較対象の半直線と並行で交わらないと判断（完全一致する線のことは考えない）
            continue
        }
        // X軸と並行
        else if (y1 === y2) {
            if ((y < y1) && ((x1 <= x && x <= x2) || (x2 <= x && x <= x1))) {
                // 半直線と交わる
                crossCnt++
            }
            continue
        } else {
            a = (y2 - y1) / (x2 - x1)
            b = y1 - a * x1
            if ((y < a * x + b) && ((x1 <= x && x < x2) || (x2 <= x && x < x1))) {
                // 半直線と交わる
                crossCnt++
            }
            continue
        }
    }
    // 交点の数が奇数ならヒット
    if (crossCnt % 2 === 1) {
        return true        
    }
    return false
}

export const drawsq = (ctx,x,y,w,h,r,color,color2) => {
    var r_color;
    r_color = ctx.createLinearGradient(x,y+h,x,y);
    r_color.addColorStop(0,color);
    r_color.addColorStop(1,color2);
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = r_color;
    ctx.fillStyle = r_color;
    ctx.moveTo(x,y + r);
    ctx.arc(x+r,y+h-r,r,Math.PI,Math.PI*0.5,true);  
    ctx.arc(x+w-r,y+h-r,r,Math.PI*0.5,0,1);
    ctx.arc(x+w-r,y+r,r,0,Math.PI*1.5,1);
    ctx.arc(x+r,y+r,r,Math.PI*1.5,Math.PI,1);       
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

export const mergeActDispPoints = (targets) => {
    let ret = {visible:false}
    targets.flat(5).forEach(target=>{
        const curr = target.getActDispPoints()
        if (curr.visible) {
            if (ret.visible) {
                ret.staPos.x = Math.min(ret.staPos.x, curr.staPos.x)
                ret.staPos.y = Math.min(ret.staPos.y, curr.staPos.y)
                ret.endPos.x = Math.max(ret.endPos.x, curr.endPos.x)
                ret.endPos.y = Math.max(ret.endPos.y, curr.endPos.y)
            } else {
                ret = curr
            }
        }
    })
    return ret
}
