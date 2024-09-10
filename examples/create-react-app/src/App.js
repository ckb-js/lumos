import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Open console and type <code>lumos</code> to try some Lumos APIs!
        </p>
        <a
          className="App-link"
          href="https://github.com/ckb-js/lumos"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lumos on GitHub
        </a>
      </header>
    </div>
  );
}

export default App;
