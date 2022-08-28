import './App.css'
import React, {useEffect, useRef, useState} from 'react'
import "react-datepicker/dist/react-datepicker.css"
import SeatsArranger from './SeatsArranger'
import {canvasInfo, seatsInfo} from './data'

const IdSelIdx = {
  Vn1: 0,
  Vn2: 1,
  Vn3: 2,
  Va: 3,
  Vc: 4,
  Cb: 5,
  MaxVal: 6,
}

const DispStateIdx = {
  CbLayer: 0,
  Vn1Label: 1,
  Vn2Label: 2,
  Vn3Label: 3,
  VaLabel: 4,
  VcLabel: 5,
  CbLabel: 6,
  PfImage: 7,
  PrintMode: 8,
  MaxVal: 9,
}

const App = () => {
  const canvasRef = useRef(null)
  const seatsArrangerRef = useRef(
    new SeatsArranger(seatsInfo, 
      dispInfo=>{
        setDispInfo(dispInfo)
  }))
  const [dispInfo, setDispInfo] = useState(null)
  const [selectedValues, setSelectedValues] = useState(Array(IdSelIdx.MaxVal).fill(0))
  const [dispStates, setDispStates] = useState(Array(DispStateIdx.MaxVal).fill(false))
  useEffect(()=>{
    const seatsArranger = seatsArrangerRef.current
    seatsArranger.setCanvas(canvasRef.current)
    const render = () =>{
      seatsArrangerRef.current.draw()
      requestAnimationFrame(render)
    }
    render()

    return () => {
      seatsArranger.end()
    }
  }, [])

  const onClick = (x, y, event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    seatsArrangerRef.current.onClick(x - rect.x, y - rect.y, event)
  }

  const onDoubleClick = (x, y, event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    seatsArrangerRef.current.onDoubleClick(x - rect.x, y - rect.y, event)
  }

  const onMouseDown = (x, y, event) => {
    if (dispStates[DispStateIdx.PrintMode] === true) {
      const newDispStates = dispStates.slice()
      newDispStates[DispStateIdx.PrintMode] = false
      setDispStates(newDispStates)
      seatsArrangerRef.current.setPrintingMode(newDispStates[DispStateIdx.PrintMode])
    } else {
      const rect = canvasRef.current.getBoundingClientRect()
      seatsArrangerRef.current.onMouseDown(x - rect.x, y - rect.y, event)
      }
  }

  const onMouseMove = (x, y, event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    seatsArrangerRef.current.onMouseMove(x - rect.x, y - rect.y, event)
  }
  
  const onMouseUp = (x, y, event)=> {
    const rect = canvasRef.current.getBoundingClientRect()
    seatsArrangerRef.current.onMouseUp(x - rect.x, y - rect.y, event)
  }

  const onMouseOut = (event)=> {
    seatsArrangerRef.current.onMouseOut(event)
  }

  const onKeyDown = (event)=> {
    seatsArrangerRef.current.onKeyDown(event)
  }

  const onKeyUp = (event)=> {
    seatsArrangerRef.current.onKeyUp(event)
  }

  const handleSelectChange = (e, idSelIdx) => {
    const newSelectedValues = selectedValues.slice()
    newSelectedValues[idSelIdx] = e.target.value
    setSelectedValues(newSelectedValues)
  }
  const handleDispStateChanged = (e, dispStateIdx) => {
    const newDispStates = dispStates.slice()
    newDispStates[dispStateIdx] = e.target.checked
    setDispStates(newDispStates)
    if (dispStateIdx === DispStateIdx.CbLayer) {
        seatsArrangerRef.current.setCbLayerVisible(newDispStates[dispStateIdx])
    } else if (dispStateIdx === DispStateIdx.PrintMode) {
      seatsArrangerRef.current.setPrintingMode(newDispStates[dispStateIdx])
    } else {
      seatsArrangerRef.current.setSimplePartsVisible(e.target.name, newDispStates[dispStateIdx])
    }
  }

  const renderIdSelect = (idSelIdx) => {
    //TODO:初期値を設定できるようにすること
    const defaultValue = {
      label: selectedValues[idSelIdx]===0? '-': selectedValues[idSelIdx].toString(),
      value: selectedValues[idSelIdx]===0? '': selectedValues[idSelIdx].toString()
    }
    return (
      <div className="cp_ipselect cp_sl01">
        <select 
          onChange={(e) => handleSelectChange(e, idSelIdx)}
          defaultValue={defaultValue}>
            <option value="0">-</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
        </select>
      </div>
    )
  }

  const DispStateItems = [
    {idx:DispStateIdx.PrintMode, id:"print-mode-disp", name:"Print-disp", text:"印刷用表示"},
    {idx:DispStateIdx.CbLayer, id:"cb-layer-disp", name:"Cb-layer", text:"Cb座席表示"},
    {idx:DispStateIdx.Vn1Label, id:"vn1-label-disp", name:"Vn1-label", text:"Vn1ラベル表示"},
    {idx:DispStateIdx.Vn2Label, id:"vn2-label-disp", name:"Vn2-label", text:"Vn2ラベル表示"},
    {idx:DispStateIdx.Vn3Label, id:"vn3-label-disp", name:"Vn3-label", text:"Vn3ラベル表示"},
    {idx:DispStateIdx.VaLabel, id:"va-label-disp", name:"Va-label", text:"Vaラベル表示"},
    {idx:DispStateIdx.VcLabel, id:"vc-label-disp", name:"Vc-label", text:"Vcラベル表示"},
    {idx:DispStateIdx.CbLabel, id:"cb-label-disp", name:"Cb-label", text:"Cbラベル表示"},
    {idx:DispStateIdx.PfImage, id:"pf-image-disp", name:"Pf-image", text:"ピアノ表示"},
  ]

  const renderDispStateChecks = () => {
    return (
      <div className="on-off-btn_wrap">
      {DispStateItems.filter(item=>dispStates[DispStateIdx.PrintMode] === false).map(item=>{
        return (
          <div className="disp-state-btn-item">
            <input type="checkbox" onChange={(e)=>handleDispStateChanged(e, item.idx)} checked={dispStates[item.idx]} name={item.name} id={item.id} />
            <label htmlFor={item.id}>{item.text}</label>
          </div>
        )
      })}
      </div>
    )
  }

  const renderGroupNumbersInTable = () => {
    if (dispStates[DispStateIdx.PrintMode] === false) {
      return(
          <tr>
            <th>グループ番号</th>
            <td>{renderIdSelect(IdSelIdx.Vn1)}</td>
            <td>{renderIdSelect(IdSelIdx.Vn2)}</td>
            <td>{renderIdSelect(IdSelIdx.Vn3)}</td>
            <td>{renderIdSelect(IdSelIdx.Va)}</td>
            <td>{renderIdSelect(IdSelIdx.Vc)}</td>
            <td>10</td>
            <td>-</td>
          </tr>
      )
    }
    return;
  }

  const renderPartNamesInTable= (idSelIdx, partName) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (dispStates[DispStateIdx.PrintMode] === true && dispStates[DispStateIdx.CbLayer] === false) {
        return
      } else {
        return (
          <th>{partName}</th>
        )
      }
    } else {
      if (dispStates[DispStateIdx.PrintMode] === true && selectedValues[idSelIdx] === 0) {
        return
      } else {
        return (
          <th>{partName}</th>
        )
      }
    }
  }

  const renderNumsOfSeatsInTable= (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (dispStates[DispStateIdx.PrintMode] === true && dispStates[DispStateIdx.CbLayer] === false) {
        return
      } else {
        return (
          <td>0</td>
        )
      }
    } else {
      if (dispStates[DispStateIdx.PrintMode] === true && selectedValues[idSelIdx] === 0) {
        return
      } else {
        return (
          <td>{dispInfo===null?0:dispInfo.numOfSeats[selectedValues[idSelIdx]]}</td>
        )
      }
    }
  }

  const renderNumsOfPianoSeatsInTable= (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (dispStates[DispStateIdx.PrintMode] === true && dispStates[DispStateIdx.CbLayer] === false) {
        return
      } else {
        return (
          <td>0</td>
        )
      }
    } else {
      if (dispStates[DispStateIdx.PrintMode] === true && selectedValues[idSelIdx] === 0) {
        return
      } else {
        return (
          <td>{dispInfo===null?0:dispInfo.numOfPianoSeats[selectedValues[idSelIdx]]}</td>
        )
      }
    }
  }

  const renderNumsOfPersonsInTable= (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (dispStates[DispStateIdx.PrintMode] === true && dispStates[DispStateIdx.CbLayer] === false) {
        return
      } else {
        return (
          <td>{dispInfo===null?0:dispInfo.numOfPersons[10]}</td>
        )
      }
    } else {
      if (dispStates[DispStateIdx.PrintMode] === true && selectedValues[idSelIdx] === 0) {
        return
      } else {
        return (
          <td>{dispInfo===null?0:dispInfo.numOfPersons[selectedValues[idSelIdx]]}</td>
        )
      }
    }
  }

  const renderNumsOfStandsInTable= (idSelIdx) => {
    if (idSelIdx === IdSelIdx.Cb) {
      if (dispStates[DispStateIdx.PrintMode] === true && dispStates[DispStateIdx.CbLayer] === false) {
        return
      } else {
        return (
          <td>{dispInfo===null?0:dispInfo.numOfStands[10]}</td>
        )
      }
    } else {
      if (dispStates[DispStateIdx.PrintMode] === true && selectedValues[idSelIdx] === 0) {
        return
      } else {
        return (
          <td>{dispInfo===null?0:dispInfo.numOfStands[selectedValues[idSelIdx]]}</td>
        )
      }
    }
  }

  const renderTableDisp = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>パート</th>
            {renderPartNamesInTable(IdSelIdx.Vn1, "Vn1")}
            {renderPartNamesInTable(IdSelIdx.Vn2, "Vn2")}
            {renderPartNamesInTable(IdSelIdx.Vn3, "Vn3")}
            {renderPartNamesInTable(IdSelIdx.Va, "Va")}
            {renderPartNamesInTable(IdSelIdx.Vc, "Vc")}
            {renderPartNamesInTable(IdSelIdx.Cb, "Cb")}
            <th>合計</th>
          </tr>
        </thead>
        <tbody>
          {renderGroupNumbersInTable()}
          <tr>
            <th>標準の座席数</th>
            {renderNumsOfSeatsInTable(IdSelIdx.Vn1)}
            {renderNumsOfSeatsInTable(IdSelIdx.Vn2)}
            {renderNumsOfSeatsInTable(IdSelIdx.Vn3)}
            {renderNumsOfSeatsInTable(IdSelIdx.Va)}
            {renderNumsOfSeatsInTable(IdSelIdx.Vc)}
            {renderNumsOfSeatsInTable(IdSelIdx.Cb)}
            <td>{dispInfo===null?0:dispInfo.numOfSeats.all}</td>
          </tr>
          <tr>
            <th>ピアノ座席数</th>
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vn1)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vn2)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vn3)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Va)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Vc)}
            {renderNumsOfPianoSeatsInTable(IdSelIdx.Cb)}
            <td>{dispInfo===null?0:dispInfo.numOfPianoSeats.all}</td>
          </tr>
          <tr>
            <th>人数</th>
            {renderNumsOfPersonsInTable(IdSelIdx.Vn1)}
            {renderNumsOfPersonsInTable(IdSelIdx.Vn2)}
            {renderNumsOfPersonsInTable(IdSelIdx.Vn3)}
            {renderNumsOfPersonsInTable(IdSelIdx.Va)}
            {renderNumsOfPersonsInTable(IdSelIdx.Vc)}
            {renderNumsOfPersonsInTable(IdSelIdx.Cb)}
            <td>{dispInfo===null?0:dispInfo.numOfPersons.all}</td>
          </tr>
          <tr>
            <th>譜面台個数</th>
            {renderNumsOfStandsInTable(IdSelIdx.Vn1)}
            {renderNumsOfStandsInTable(IdSelIdx.Vn2)}
            {renderNumsOfStandsInTable(IdSelIdx.Vn3)}
            {renderNumsOfStandsInTable(IdSelIdx.Va)}
            {renderNumsOfStandsInTable(IdSelIdx.Vc)}
            {renderNumsOfStandsInTable(IdSelIdx.Cb)}
            <td>{dispInfo===null?0:dispInfo.numOfStands.all}</td>
          </tr>
        </tbody>
      </table>
    )
  }
  // numInfoオブジェクトの中身は、{numOfSeats: {1:xxx, 2:xxx,...}, numOfStands: {1:xxx, 2:xxx,...} }
  return (
    <div className="App">
      <h1>
        <textarea rows={1} cols={50} className="text-title" /><br/>
        <textarea rows={1} cols={50} className="sub-title" /><br/>
        <textarea rows={2} cols={100} className="text-comment" />
      </h1>
      <div>
        <canvas
          id="stage"
          tabIndex="0"
          onClick={(event)=>onClick(event.clientX, event.clientY, event)}
          onDoubleClick={(event)=>onDoubleClick(event.clientX, event.clientY, event)}
          onMouseDown={(event)=>onMouseDown(event.clientX, event.clientY, event)}
          onMouseMove={(event)=>onMouseMove(event.clientX, event.clientY, event)}
          onMouseUp={(event)=>onMouseUp(event.clientX, event.clientY, event)}
          onMouseOut={(event)=>onMouseOut(event)}
          onKeyDown={(event)=>onKeyDown(event)}
          onKeyUp={(event)=>onKeyUp(event)}
          ref={canvasRef}
          height={canvasInfo.h}
          width={canvasInfo.w}
        />
      </div>
      {renderDispStateChecks()}
      {renderTableDisp()}
    </div>
  )
}

export default App