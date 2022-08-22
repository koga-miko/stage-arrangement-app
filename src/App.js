import './App.css'
import React, {useEffect, useRef, useState} from 'react'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import moment from 'moment'
import SeatsArranger from './SeatsArranger'
import {seatsInfo} from './data'

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
  const [startDate, setStartDate] = useState(toUtcIso8601str(moment()))
  useEffect(()=>{
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const seatsArranger = seatsArrangerRef.current
    seatsArranger.makeSeats(canvas.width, canvas.height)
//    var dataURL = canvas.toDataURL();

    const render = () =>{
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      seatsArranger.draw(ctx)
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
    }
    const rect = canvasRef.current.getBoundingClientRect()
    seatsArrangerRef.current.onMouseDown(x - rect.x, y - rect.y, event)
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
    if (dispStates[DispStateIdx.PrintMode] === true) {
      const newDispStates = dispStates.slice()
      newDispStates[DispStateIdx.PrintMode] = false
      setDispStates(newDispStates)
      seatsArrangerRef.current.setPrintingMode(newDispStates[DispStateIdx.PrintMode])
    }
    seatsArrangerRef.current.onKeyDown(event)
  }

  const onKeyUp = (event)=> {
    seatsArrangerRef.current.onKeyUp(event)
  }

  const handleDateChange = (selectedDate) => {
    setStartDate(toUtcIso8601str(moment(selectedDate)))
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

  const RenderIdSelect = (idSelIdx) => {
    return (
      <div className="cp_ipselect cp_sl01">
        <select onChange={(e) => handleSelectChange(e, idSelIdx)}>
          <option value="">-</option>
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

  const renderTableDisp = () => {
    if (dispStates[DispStateIdx.PrintMode] === false) {
      return (
        <table>
          <thead>
            <tr>
              <th>パート</th>
              <th>Vn1</th>
              <th>Vn2</th>
              <th>Vn3</th>
              <th>Va</th>
              <th>Vc</th>
              <th>Cb</th>
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>グループ番号</th>
              <td>{RenderIdSelect(IdSelIdx.Vn1)}</td>
              <td>{RenderIdSelect(IdSelIdx.Vn2)}</td>
              <td>{RenderIdSelect(IdSelIdx.Vn3)}</td>
              <td>{RenderIdSelect(IdSelIdx.Va)}</td>
              <td>{RenderIdSelect(IdSelIdx.Vc)}</td>
              <td>10</td>
              <td>-</td>
            </tr>
            <tr>
              <th>座席数</th>
              <td>{dispInfo===null?0:dispInfo.numOfSeats[selectedValues[IdSelIdx.Vn1]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfSeats[selectedValues[IdSelIdx.Vn2]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfSeats[selectedValues[IdSelIdx.Vn3]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfSeats[selectedValues[IdSelIdx.Va]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfSeats[selectedValues[IdSelIdx.Vc]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfSeats[10]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfSeats.all}</td>
            </tr>
            <tr>
              <th>譜面台個数</th>
              <td>{dispInfo===null?0:dispInfo.numOfStands[selectedValues[IdSelIdx.Vn1]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfStands[selectedValues[IdSelIdx.Vn2]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfStands[selectedValues[IdSelIdx.Vn3]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfStands[selectedValues[IdSelIdx.Va]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfStands[selectedValues[IdSelIdx.Vc]]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfStands[10]}</td>
              <td>{dispInfo===null?0:dispInfo.numOfStands.all}</td>
            </tr>
          </tbody>
        </table>
      )
    }
  }
  // numInfoオブジェクトの中身は、{numOfSeats: {1:xxx, 2:xxx,...}, numOfStands: {1:xxx, 2:xxx,...} }
  return (
    <div>
      <h1>
        {/* <ul className="title_col">
          <li className="title_date">
              <DatePicker
                selected={moment(startDate).toDate()}
                onChange={handleDateChange}
                customInput={
                <div>
                  {parseAsMoment(startDate).format('YYYY/MM/DD')}
                </div>
                }
              />
          </li>
          <li>
            <textarea rows={1} cols={50} className="text-title" />
          </li>
        </ul> */}
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
          height="900"
          width="1800"
        />
      </div>
      {renderDispStateChecks()}
      {renderTableDisp()}
    </div>
  )
}

/**
 * JST基準に変換して返す
 * @param {string} dateTimeStr YYYY-MM-DDTHH:mm:00Z
 * @returns {moment.Moment}
 */
const parseAsMoment = (dateTimeStr) => {
  return moment.utc(dateTimeStr, 'YYYY-MM-DDTHH:mm:00Z', 'ja').utcOffset(9)
}

/**
 * 日付形式に変換して返す
 * @param {moment.Moment} momentInstance
 * @returns {string}
 */
const toUtcIso8601str = (momentInstance) => {
  return momentInstance
      .clone()
      .utc()
      .format('YYYY-MM-DDTHH:mm:00Z')
}

export default App