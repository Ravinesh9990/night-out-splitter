import { useState } from 'react'
import jsPDF from 'jspdf'
import './App.css'

function App() {
  const [personName, setPersonName] = useState('')
  const [people, setPeople] = useState([])

  const [payer, setPayer] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [sharedWith, setSharedWith] = useState([])

  const [transactions, setTransactions] = useState([])

  const addPerson = () => {
    if (!personName.trim()) return

    if (people.includes(personName.trim())) {
      alert('Person already added')
      return
    }

    setPeople([...people, personName.trim()])
    setPersonName('')
  }

  const toggleSharedPerson = (name) => {
    if (sharedWith.includes(name)) {
      setSharedWith(sharedWith.filter((p) => p !== name))
    } else {
      setSharedWith([...sharedWith, name])
    }
  }

  const allSelected =
    people.length > 0 && sharedWith.length === people.length

  const toggleSelectAll = () => {
    if (allSelected) setSharedWith([])
    else setSharedWith([...people])
  }

  const addTransaction = () => {
    if (!payer || !amount || sharedWith.length === 0) {
      alert('Please complete all fields')
      return
    }

    const newTransaction = {
      id: Date.now(),
      payer,
      description,
      amount: parseFloat(amount),
      sharedWith,
    }

    setTransactions([...transactions, newTransaction])

    setPayer('')
    setDescription('')
    setAmount('')
    setSharedWith([])
  }

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  const calculateSettlement = () => {
    const balances = {}

    people.forEach((p) => (balances[p] = 0))

    transactions.forEach((tx) => {
      const split = tx.amount / tx.sharedWith.length

      tx.sharedWith.forEach((p) => {
        balances[p] -= split
      })

      balances[tx.payer] += tx.amount
    })

    const creditors = []
    const debtors = []

    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) creditors.push({ person, amount: balance })
      else if (balance < -0.01) debtors.push({ person, amount: -balance })
    })

    const settlements = []
    let i = 0, j = 0

    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i]
      const c = creditors[j]

      const pay = Math.min(d.amount, c.amount)

      settlements.push({
        from: d.person,
        to: c.person,
        amount: pay,
      })

      d.amount -= pay
      c.amount -= pay

      if (d.amount < 0.01) i++
      if (c.amount < 0.01) j++
    }

    return { settlements }
  }

  const result = calculateSettlement()

  const exportPDF = () => {
    const doc = new jsPDF()
    let y = 10

    doc.setFontSize(16)
    doc.text("Night Out Bill Splitter", 10, y)
    y += 10

    doc.setFontSize(12)
    doc.text("Transactions:", 10, y)
    y += 8

    transactions.forEach((t) => {
      const line = `${t.description || "No desc"} | RM ${t.amount.toFixed(2)} | ${t.payer}`
      doc.text(line, 10, y)
      y += 8
    })

    y += 6
    doc.text("Settlements:", 10, y)
    y += 8

    result.settlements.forEach((s) => {
      const line = `${s.from} -> ${s.to} : RM ${s.amount.toFixed(2)}`
      doc.text(line, 10, y)
      y += 8
    })

    doc.save("bill-split.pdf")
  }

  return (
    <div className="container">
      <h1>Night Out Bill Splitter</h1>

      <div className="card">
        <h2>Add Friends</h2>

        <div className="row">
          <input
            value={personName}
            placeholder="Enter friend name"
            onChange={(e) => setPersonName(e.target.value)}
          />
          <button onClick={addPerson}>Add</button>
        </div>

        <div className="people-list">
          {people.map((p, i) => (
            <span key={i} className="tag">{p}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Add Spending</h2>

        <div className="row">

                  <select value={payer} onChange={(e) => setPayer(e.target.value)}>
          <option value="">Who Paid?</option>
          {people.map((p, i) => (
            <option key={i} value={p}>{p}</option>
          ))}
        </select>
        
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="amount-input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <h3>Share With</h3>

        <div className="select-all">
          <label>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            Select All
          </label>
        </div>

        <div className="checkbox-list">
          {people.map((p, i) => (
            <label key={i} className="checkbox-item">
              <input
                type="checkbox"
                checked={sharedWith.includes(p)}
                onChange={() => toggleSharedPerson(p)}
              />
              {p}
            </label>
          ))}
        </div>

        <button onClick={addTransaction}>Add Transaction</button>
      </div>

      <div className="card">
        <h2>Transaction History</h2>

        {transactions.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="transaction-card">
              <div className="tx-top">
                <strong>{t.description || "No description"}</strong>
                <span>RM {t.amount.toFixed(2)}</span>
              </div>

              <div className="tx-bottom">
                Paid by {t.payer} • Shared: {t.sharedWith.join(', ')}
              </div>

              <button className="delete-btn" onClick={() => deleteTransaction(t.id)}>
                Delete
              </button>
            </div>
          ))
        )}

        <button className="export-btn" onClick={exportPDF}>
          Export PDF
        </button>
      </div>

      <div className="card">
        <h2>Final Settlement</h2>

        {result.settlements.length === 0 ? (
          <p>No settlement needed</p>
        ) : (
          result.settlements.map((s, i) => (
            <div key={i} className="settlement">
              <b>{s.from}</b> → <b>{s.to}</b> RM {s.amount.toFixed(2)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App