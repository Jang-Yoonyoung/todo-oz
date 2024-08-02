import { useEffect, useRef, useState } from 'react'
import './App.css'

export default function App() {
  const [isLoading, data] = useFetch("http://localhost:3000/todo")
  const [todo, setTodo] = useState([]) // 초기상태
  const [currentTodo, setCurrentTodo] = useState(null)
  const [time, setTime] = useState(0)
  const [isTimer, setIsTimer] = useState(false)

  useEffect(() => {
    if (currentTodo) {
      fetch(`http://localhost:3000/todo/${currentTodo}`, {
        method: "PATCH",
        body: JSON.stringify({
          time: todo.find((el) => el.id === 
          currentTodo).time + 1
        }),
      })
      .then(res => res.json())
      .then(res => setTodo(prev => prev.map(el => el.id === currentTodo ? res : el)))
    }
  }, [time])

  useEffect(() => {
    setTime(0)
  }, [isTimer])


  useEffect(() => {
    if (data) setTodo(data)
  }, [isLoading])

  return (
    <>
      <h1>TODO LIST</h1>
      <Clock />
      <Advice />
      <button onClick={() => setIsTimer(prev => !prev)}>
        {isTimer ? "stopwatch 변경" : "timer 변경"}</button>
      { isTimer ?
      <Timer time={time} setTime={setTime} /> :
      <StopWatch time={time} setTime={setTime} />}  
      <TodoInput setTodo={setTodo} />
      <TodoList todo={todo} setTodo={setTodo} 
      setCurrentTodo={setCurrentTodo} currentTodo={currentTodo} />
    </>
  )
}

// todo배열 각 항목을 <Todo/>로 렌더링
const TodoList = ({ todo, setTodo, setCurrentTodo, currentTodo }) => {
  return (
    <>
      <ul>
        {todo.map((el) => (
          <Todo 
            key={todo.id} 
            todo={el} 
            setTodo={setTodo}
            currentTodo={currentTodo} 
            setCurrentTodo={setCurrentTodo}/>
        ))}
      </ul>
    </>
  )
}

// <Todo/> 각 todo리스트 & 삭제 버튼
const Todo = ({ todo, setTodo, setCurrentTodo, currentTodo }) => {
  return (
    <li className={currentTodo === todo.id ? "current" : ""}>
      <div>
      {todo.content}   {/* todo 내용 출력 */}
      <br />
      {formatTime(todo.time)}
      </div>

      <div>
      <button onClick={() => setCurrentTodo(todo.id)}>시작하기</button>

      <button onClick={() => { // 삭제 클릭 시 setTodo 호출
        fetch(`http://localhost:3000/todo/${todo.id}`, {
          method: "DELETE",
        }).then((res) => {
          if(res.ok) {
            setTodo((prev) => prev.filter((el) => el.id !== todo.id))
          }
        })
      }}
      >삭제</button>
      </div>
    </li>
  )
}

const useFetch = (url) => {
  const [isLoading, setIsLoading] = useState(true) // data 받아오는 중
  const [data, setData] = useState(null)           // data 받아 올 공간

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        setData(res)
        setIsLoading(false) 
      })
  }, [url])

  return [isLoading, data]
}

const Advice = () => {
  const [isLoading, data] = useFetch("https://korean-advice-open-api.vercel.app/api/advice")

  return (
    <>
      {!isLoading && (
        <>
        <div className='advice'>{data.message}</div>
        <div className='advice'>-{data.author}-</div>
        </>
      )}
    </>
  )
}

// Clock 현재 시간
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setInterval(() => {
      setTime(new Date())
    }, 1000);
  }, [])

  return <div className='clock'>{time.toLocaleTimeString()}</div>
}

// format
const formatTime = (seconds) => {
  // 00:00:00
  // 12345
  // 12345 / 3600(절대값) -> 시간
  // (12345 % 3600) / 60(절대값) -> 분
  // 12345 % 60 -> 초
  const timeString = `
  ${String(Math.floor(seconds / 3600)).padStart(2, "0")}:
  ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:
  ${String(seconds % 60).padStart(2, "0")}`

  return timeString;
}


// StopWatch
const StopWatch = ({ time, setTime }) => {
  const [isOn, setIsOn] = useState(false) // 초기값 : 꺼져있는 상태
  const timerRef = useRef(null)

  useEffect(() => {
    if (isOn === true) {
      const timerId = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000);
      timerRef.current = timerId
    } else {
      clearInterval(timerRef.current)
    }
    
  }, [isOn])

  return (
  <div>
    {formatTime(time)}
    <button onClick={() => setIsOn(prev => !prev)}>{isOn ? "끄기" : "켜기"}</button>
    <button
      onClick={() => { // 리셋 = 초기화 
        setTime(0)
        setIsOn(false)
      }
    }>리셋</button>
  </div>
  )
}

// Timer
const Timer = ({ time, setTime }) => {
  const [startTime, setStartTime] = useState(0) // 시작 시간 초기값 : 0
  const [isOn, setIsOn] = useState(false)       // 초기값 : 꺼져있는 상태
  const timerRef = useRef(null)

  useEffect(() => {
    if (isOn && time > 0) {
      const timerId = setInterval (() => {
        setTime((prev) => prev - 1)
      }, 1000)
      timerRef.current = timerId
    } else if (!isOn || time == 0) {   // 0이되는 순간 멈춤
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isOn, time])

  return (
    <div>
      <div>
        {time ? formatTime(time) : formatTime(startTime)}

        <button onClick={() => {
          setIsOn(true)
          setTime(time ? time : startTime) // time 값이 있다면 time 부터 시작 아니면 startTime
          setStartTime(0)
          }
        }>시작</button>
        
        <button onClick={() => setIsOn(false)}>멈춤</button>

        <button onClick={() => {
          setTime(0)
          setIsOn(false)
        }}>리셋</button>
      </div>

      <input 
      type='range'
      value={startTime}
      min='0'     // min 시간 : 0
      max='3600'  // max 시간 : 3600 => 1시간
      step='30'   // 30초씩
      onChange={(event) => setStartTime(event.target.value)} />
    </div>
  )
}

// input창 & 추가 버튼
const TodoInput = ({ setTodo }) => {
  const inputRef = useRef(null) // 초기값 : null
  const addTodo = () => {       // 새로운 할 일 생성
    const newTodo = {           // 검색된 새로운 할 일
      id: Number(new Date()).toString(),
      content: inputRef.current.value,
      time: 0,
    }
    fetch("http://localhost:3000/todo", {
      method: "POST",
      body: JSON.stringify(newTodo),
    })
    .then((res) => res.json())
     // 이전 상태에서, 생성한 새로운 할 일을 todo배열에 추가
    .then((res) => setTodo((prev) => [...prev, res]))
  }

  return (
    <>
      <input ref={inputRef}/>
      <button onClick={addTodo}>추가</button>
    </>
  )
}






