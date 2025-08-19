import { Routes, Route, BrowserRouter } from 'react-router-dom'
import PostDocPage from './pages/PostDocPage'
import AlumniPage from './pages/AlumniPage'

const App = () => {

  return (
    <>
      <BrowserRouter >
        <Routes>
          <Route path="/" Component={PostDocPage} />
          <Route path="/alumni" Component={AlumniPage} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
