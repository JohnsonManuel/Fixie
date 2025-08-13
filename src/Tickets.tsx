function TicketsPage() {
    return (
      <div className="tickets-page">
        <header className="tickets-header">
          <h2>Tickets</h2>
          {/* optional toolbar */}
          <div className="tickets-actions">
            <button className="btn small">New Ticket</button>
          </div>
        </header>
  
        <div className="tickets-body">
          {/* Replace with your real table/list later */}
          <div className="card">
            <p>No tickets yet. Connect your ITSM or create one.</p>
          </div>
        </div>
      </div>
    );
  }

  export default TicketsPage;
  