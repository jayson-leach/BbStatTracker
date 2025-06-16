import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import './styles.css';

export default function StatTrackerApp() {
  // State variables to manage the app's stages and data
  const [stage, setStage] = useState('matchup');
  const [teamNames, setTeamNames] = useState([]);
  const [rosters, setRosters] = useState({});
  const [matchup, setMatchup] = useState({ home: '', away: '' });
  const [teams, setTeams] = useState({ teamA: [], teamB: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState(1);
  const [selectedStat, setSelectedStat] = useState(null);
  const [playByPlay, setPlayByPlay] = useState([]);
  const [activePlayers, setActivePlayers] = useState({
    teamA: [],
    teamB: []
  });
  const [subOutPlayer, setSubOutPlayer] = useState(null);
  const [starterSelection, setStarterSelection] = useState({ teamA: [], teamB: [] });
  const [subMenu, setSubMenu] = useState({ teamKey: null, outPlayer: null });
  // State for bench add number input
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addPlayerTeam, setAddPlayerTeam] = useState('');
  const [addPlayerNumber, setAddPlayerNumber] = useState('');
  const [showAddKnownPlayer, setShowAddKnownPlayer] = useState(false);
  const [addPlayerName, setAddPlayerName] = useState('');
  // New states for removing players
  const [showRemovePlayer, setShowRemovePlayer] = useState(false);
  const [removePlayerTeam, setRemovePlayerTeam] = useState('');
  const [removePlayerName, setRemovePlayerName] = useState('');
  // New states for editng players
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [editPlayerTeam, setEditPlayerTeam] = useState('');
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerNewName, setEditPlayerNewName] = useState('');
  const [editPlayerNewNumber, setEditPlayerNewNumber] = useState('');
  // New substitution states
  const [subSelection, setSubSelection] = useState({ teamA: [], teamB: [] });
  const [subTeamKey, setSubTeamKey] = useState(null);


  // Reset starter selection when stage changes to 'matchup'
  useEffect(() => {
    if (stage === 'matchup') {
      setStarterSelection({ teamA: [], teamB: [] });
    }
  }, [stage]);

  // Fetch teams and rosters from Supabase
  useEffect(() => {
    async function fetchData() {
      const teamRes = await fetch('/api/getTeams');
      const teamData = await teamRes.json();
      // Format: [{ team: 'Lincoln', gender: 'Boys' }, ...]
      const teamList = [];
      teamData.forEach(row => {
        const baseName = row.Team?.trim();
        const gender = row.Gender?.trim();
        if (!baseName || !gender) return;
        const teamName = `${baseName} -- ${gender}`;
        if (!teamList.includes(teamName)) teamList.push(teamName);
      });

      const rosterRes = await fetch('/api/getRoster');
      const rosterData = await rosterRes.json();
      // Format: [{ Team, Gender, 'Player Name', Number }, ...]
      const teamMap = {};
      rosterData.forEach(row => {
        const baseName = row.Team?.trim();
        const gender = row.Gender?.trim();
        const player = {
          'Player Name': row['Player Name']?.trim(),
          Number: row.Number || '',
        };
        if (!baseName || !gender || !player['Player Name']) return;
        const teamName = `${baseName} -- ${gender}`;
        if (!teamMap[teamName]) teamMap[teamName] = [];
        // Only add if not already present (by name and number)
        if (!teamMap[teamName].some(
          p => p['Player Name'] === player['Player Name'] && p.Number === player.Number
        )) {
          teamMap[teamName].push(player);
        }
      });

      teamList.forEach(teamName => {
        if (!teamMap[teamName]) teamMap[teamName] = [];
      });

      setRosters(teamMap);
      setTeamNames(teamList);
    }
    fetchData();
  }, []);

  // Handle matchup confirmation and set teams for tracking
  const confirmMatchup = () => {
    if (!matchup.home || !matchup.away || matchup.home === matchup.away) return;
    const homeRoster = rosters[matchup.home];
    const awayRoster = rosters[matchup.away];
    setTeams({ teamA: homeRoster, teamB: awayRoster });
    console.log('Matchup confirmed:', matchup);
    setStage('starters');
  };

  // Initialize player statistics for tracking box score
  const [stats, setStats] = useState(() => {
    const allPlayers = [...teams.teamA, ...teams.teamB];
    const initial = {};
    allPlayers.forEach(p => {
      initial[p['Player Name']] = {
        points: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0,
        blocks: 0, fouls: 0, turnovers: 0,
        fgMade: 0, fgAttempted: 0,
        threeMade: 0, threeAttempted: 0,
        ftMade: 0, ftAttempted: 0,
      };
    });
    return initial;
  });

  // Reset stats when stage changes to 'starters' and teams are set
  useEffect(() => {
    if (stage === 'starters' && teams.teamA.length && teams.teamB.length) {
      const allPlayers = [...teams.teamA, ...teams.teamB];
      const freshStats = {};
      allPlayers.forEach((p) => {
        freshStats[p['Player Name']] = {
          points: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0,
          blocks: 0, fouls: 0, turnovers: 0,
          fgMade: 0, fgAttempted: 0,
          threeMade: 0, threeAttempted: 0,
          ftMade: 0, ftAttempted: 0,
        };
      });
      setStats(freshStats);
    }
  }, [stage, teams]);


// When opening the substitution menu, set subSelection to current activePlayers
useEffect(() => {
  if (selectedStat && selectedStat.label === 'Substitution') {
    setSubSelection({
      teamA: activePlayers.teamA,
      teamB: activePlayers.teamB
    });
  }
  // Only run when substitution menu is opened or activePlayers change
  // eslint-disable-next-line
}, [selectedStat, activePlayers]);

  // Prepare team options for the select dropdown
  const teamOptions = teamNames.sort().map((name) => ({ value: name, label: name }));

  // If the stage is 'matchup', render the matchup selection UI
  if (stage === 'matchup') {
    return (
      <div>
      <header className="main-header">
  <h1>🏀 Hoop Tracker</h1>
</header>
      <h1>Select Matchup</h1>
      <div>
        <div className="event-select-container">
      <p>Select Event</p>
    <Select
      options={[
        { value: 'box_scores_section_7', label: 'Section 7 - 2025' },
        { value: 'box_scores_test', label: 'Test' }
      ]}
      value={selectedEvent}
      onChange={(option) => setSelectedEvent(option)}
      placeholder="Choose an event"
    />
      </div>
    <br />

        <p>Home Team</p>
        <Select
        options={teamOptions}
        value={matchup.home ? { value: matchup.home, label: matchup.home } : null}
        onChange={(opt) => setMatchup((prev) => ({ ...prev, home: opt?.value || '' }))}
        placeholder="Select home team"
        />
        <br />
        <p>Away Team</p>
        <Select
        options={teamOptions}
        value={matchup.away ? { value: matchup.away, label: matchup.away } : null}
        onChange={(opt) => setMatchup((prev) => ({ ...prev, away: opt?.value || '' }))}
        placeholder="Select away team"
        />
        <br />
        <p>Date</p>
        <input
        type="date"
        style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
        value={matchup.date || ''}
        onChange={opt => setMatchup(prev => ({ ...prev, date: opt.target.value }))}
        />
        <br />
        <br />
        <p>Court Number</p>
        <input
        type="number"
        min={1}
        max={30}
        style={{ fontSize: '1rem', padding: '0.5rem 1rem', width: 120 }}
        value={matchup.court || ''}
        onChange={e => setMatchup(prev => ({ ...prev, court: e.target.value ? Number(e.target.value) : '' }))}
        placeholder="Court #"
        />
      </div>
      <br />
      <button
        className="disabled:opacity-50"
        onClick={confirmMatchup}
        disabled={
        !matchup.home ||
        !matchup.away ||
        matchup.home === matchup.away ||
        !matchup.court ||
        !matchup.date
        }
      >
        Confirm Matchup
      </button>
      </div>
    );
  }

  // Initialize active players with the first 5 selected
  const toggleStarter = (teamKey, player) => {
    setStarterSelection(prev => {
      const current = prev[teamKey];
      const exists = current.includes(player);
      const updated = exists ? current.filter(p => p !== player) : [...current, player].slice(0, 5);
      return { ...prev, [teamKey]: updated };
    });
  };

  // Confirm starters and set them as active players
  const confirmStarters = () => {
    if (starterSelection.teamA.length === 5 && starterSelection.teamB.length === 5) {
      setActivePlayers({
        teamA: starterSelection.teamA,
        teamB: starterSelection.teamB
      });
      setStage('tracking');
    }
  };

  // Handle player substitution when a player is clicked to be subbed out
  const handleSubOutClick = (teamKey, player) => {
    setSubMenu({ teamKey, outPlayer: player });
  };

  // Handle player substitution when a player is selected to be subbed in
  const handleSubIn = (inPlayer) => {
    const { teamKey, outPlayer } = subMenu;
    if (!teamKey || !outPlayer || !inPlayer) return;
    onSubstitute(teamKey, outPlayer, inPlayer);
    setSubMenu({ teamKey: null, outPlayer: null });
  };

  // Perform the substitution by replacing the out player with the in player
  const onSubstitute = (teamKey, outPlayer, inPlayer) => {
    setActivePlayers(prev => {
      const updated = { ...prev };
      const newLineup = prev[teamKey].map(p =>
        p['Player Name'] === outPlayer['Player Name'] ? inPlayer : p
      );
      updated[teamKey] = newLineup;
      return updated;
    });
    setPlayByPlay(prev => [`P${period}: Substitution - #${outPlayer.Number} ${outPlayer['Player Name']} OUT, #${inPlayer.Number} ${inPlayer['Player Name']} IN`, ...prev]);
    setHistory(prev => [
      ...prev,
      {
        type: 'substitution',
        teamKey: 'teamA', // or 'teamB'
        outPlayer: outPlayer,
        inPlayer: inPlayer
      },
    ]);
    setSelectedStat(null);
    setSubOutPlayer(null);
  }

  // If the stage is 'starters', render the starter selection UI
  if (stage === 'starters') {
    return (
      <div>
      <header className="main-header">
        <h1>🏀 Hoop Tracker</h1>
      </header>
      <h1>Select Starters</h1>
      <p>You must select 5 players for each team to start tracking stats.</p>

      {['teamA', 'teamB'].map(teamKey => (
      <div key={teamKey}>
      <div style={{alignItems: 'center', gap: 12 }}>
      <h2>{teamKey === 'teamA' ? matchup.home : matchup.away}</h2>
      <br />
      <AddPlayerButton
      teamKey={teamKey}
      teamName={teamKey === 'teamA' ? matchup.home : matchup.away}
      onAdd={async (player) => {
        if (!player['Player Name'] || !player.Number) return;
        setTeams(prev => ({
        ...prev,
        [teamKey]: [...prev[teamKey], player]
        }));
        setRosters(prev => ({
        ...prev,
        [teamKey === 'teamA' ? matchup.home : matchup.away]: [
          ...(prev[teamKey === 'teamA' ? matchup.home : matchup.away] || []),
          player
        ]
        }));
        setStarterSelection(prev => {
        if (prev[teamKey].length < 5) {
          return {
          ...prev,
          [teamKey]: [...prev[teamKey], player]
          };
        }
        return prev;
        });
        // Drop ' | Boys' or ' | Girls' from team name for backend
        const fullTeamName = teamKey === 'teamA' ? matchup.home : matchup.away;
        let baseName = fullTeamName;
        let gender = '';
        if (fullTeamName.includes(' -- ')) {
        [baseName, gender] = fullTeamName.split(' -- ');
        }
        await fetch('/api/addPlayerToRoster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: baseName.trim(),
          gender: gender.trim(),
          player: player
        })
        });
        // Re-fetch roster from Supabase and update state
        const rosterRes = await fetch('/api/getRoster');
        const rosterData = await rosterRes.json();
        // Format: [{ Team, Gender, 'Player Name', Number }, ...]
        const teamMap = {};
        rosterData.forEach(row => {
        const baseName = row.Team?.trim();
        const gender = row.Gender?.trim();
        const playerObj = {
          'Player Name': row.player_name?.trim(),
          Number: row.number || '',
        };
        if (!baseName || !gender || !playerObj['Player Name']) return;
        const teamName = `${baseName} -- ${gender}`;
        if (!teamMap[teamName]) teamMap[teamName] = [];
        // Only add if not already present (by name and number)
        if (!teamMap[teamName].some(
          p => p['Player Name'] === playerObj['Player Name'] && p.Number === playerObj.Number
        )) {
          teamMap[teamName].push(playerObj);
        }
        });
        setRosters(teamMap);
        // Optionally update teams if needed
        if (teamMap[fullTeamName]) {
        setTeams(prev => ({
          ...prev,
          [teamKey]: teamMap[fullTeamName]
        }));
        }
      }}
      />
      <button
        style={{ marginLeft: 8 }}
        onClick={() => {
          setEditPlayerTeam(teamKey);
          setEditPlayerName('');
          setEditPlayerNewName('');
          setEditPlayerNewNumber('');
          setShowEditPlayer(true);
        }}
        title="Edit player"
      >
        Edit Player
      </button>
      </div>
      <h3>Selected: {starterSelection[teamKey].length}/5</h3>
      <br />
      <div>
      {teams[teamKey].map(player => (
      <button
      key={player['Player Name']}
      className={`toggle-starter-button ${starterSelection[teamKey].includes(player) ? 'active' : ''}`}
      onClick={() => toggleStarter(teamKey, player)}
      >
      #{player.Number} {player['Player Name']}
      </button>
      ))}
      </div>
      </div>
      ))}

      {/* Remove Player button and modal */}
      <br />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16}}>
        <button onClick={() => setShowRemovePlayer(true)} style={{background: '#f25c5c'}}>
          Remove Player
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
      <button onClick={confirmStarters}>
      Confirm Starters
      </button>
      <button onClick={() => setStage('matchup')}>
      Back to Matchup
      </button>
      </div>


      {showRemovePlayer && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            minWidth: 320,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}>
            <h3>Remove Player</h3>
            <div style={{ marginBottom: 12 }}>
              <label>
                Team:
                <select
                  value={removePlayerTeam}
                  onChange={e => {
                    setRemovePlayerTeam(e.target.value);
                    setRemovePlayerName(''); // Reset player selection when team changes
                  }}
                  style={{ marginLeft: 8, marginBottom: 8 }}
                >
                  <option value="">Select Team</option>
                  <option value="teamA">{matchup.home}</option>
                  <option value="teamB">{matchup.away}</option>
                </select>
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Player:
                <select
                  value={removePlayerName}
                  onChange={e => setRemovePlayerName(e.target.value)}
                  style={{ marginLeft: 8, minWidth: 140 }}
                  disabled={!removePlayerTeam}
                >
                  <option value="">Select Player</option>
                  {removePlayerTeam && teams[removePlayerTeam].map(p => (
                    <option key={p['Player Name']} value={p['Player Name']}>
                      #{p.Number} {p['Player Name']}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                style={{ background: '#f25c5c', marginRight: 8 }}
                disabled={!removePlayerTeam || !removePlayerName}
                onClick={() => {
                  // Remove from teams, rosters, and starterSelection if present
                  setTeams(prev => ({
                    ...prev,
                    [removePlayerTeam]: prev[removePlayerTeam].filter(
                      p => p['Player Name'] !== removePlayerName
                    )
                  }));
                  setRosters(prev => {
                    const teamLabel = removePlayerTeam === 'teamA' ? matchup.home : matchup.away;
                    return {
                      ...prev,
                      [teamLabel]: (prev[teamLabel] || []).filter(
                        p => p['Player Name'] !== removePlayerName
                      )
                    };
                  });
                  setStarterSelection(prev => ({
                    ...prev,
                    [removePlayerTeam]: prev[removePlayerTeam].filter(
                      p => p['Player Name'] !== removePlayerName
                    )
                  }));
                  setShowRemovePlayer(false);
                  setRemovePlayerTeam('');
                  setRemovePlayerName('');
                }}
              >
                Confirm Remove
              </button>
              <button
                onClick={() => {
                  setShowRemovePlayer(false);
                  setRemovePlayerTeam('');
                  setRemovePlayerName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPlayer && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            minWidth: 320,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}>
            <h3>
              Edit Player on {editPlayerTeam === 'teamA' ? matchup.home : editPlayerTeam === 'teamB' ? matchup.away : ''}
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label>
                Player:
                <select
                  value={editPlayerName}
                  onChange={e => {
                    const name = e.target.value;
                    setEditPlayerName(name);
                    const player = teams[editPlayerTeam].find(p => p['Player Name'] === name);
                    setEditPlayerNewName(player ? player['Player Name'] : '');
                    setEditPlayerNewNumber(player ? player.Number : '');
                  }}
                  style={{ marginLeft: 8, minWidth: 140 }}
                >
                  <option value="">Select Player</option>
                  {teams[editPlayerTeam].map(p => (
                    <option key={p['Player Name']} value={p['Player Name']}>
                      #{p.Number} {p['Player Name']}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Name:
                <input
                  type="text"
                  value={editPlayerNewName}
                  onChange={e => setEditPlayerNewName(e.target.value)}
                  style={{ marginLeft: 8, width: 140 }}
                  disabled={!editPlayerName}
                />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Number:
                <input
                  type="text"
                  value={editPlayerNewNumber}
                  onChange={e => setEditPlayerNewNumber(e.target.value)}
                  style={{ marginLeft: 8, width: 60 }}
                  disabled={!editPlayerName}
                />
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                style={{ marginRight: 8 }}
                disabled={
                  !editPlayerName ||
                  !editPlayerNewName.trim() ||
                  !editPlayerNewNumber.trim()
                }
                onClick={() => {
                  // Update in teams
                  setTeams(prev => ({
                    ...prev,
                    [editPlayerTeam]: prev[editPlayerTeam].map(p =>
                      p['Player Name'] === editPlayerName
                        ? { ...p, 'Player Name': editPlayerNewName.trim(), Number: editPlayerNewNumber.trim() }
                        : p
                    )
                  }));
                  // Update in rosters
                  setRosters(prev => {
                    const teamLabel = editPlayerTeam === 'teamA' ? matchup.home : matchup.away;
                    return {
                      ...prev,
                      [teamLabel]: (prev[teamLabel] || []).map(p =>
                        p['Player Name'] === editPlayerName
                          ? { ...p, 'Player Name': editPlayerNewName.trim(), Number: editPlayerNewNumber.trim() }
                          : p
                      )
                    };
                  });
                  // Update in starterSelection
                  setStarterSelection(prev => ({
                    ...prev,
                    [editPlayerTeam]: prev[editPlayerTeam].map(p =>
                      p['Player Name'] === editPlayerName
                        ? { ...p, 'Player Name': editPlayerNewName.trim(), Number: editPlayerNewNumber.trim() }
                        : p
                    )
                  }));
                  setShowEditPlayer(false);
                  setEditPlayerTeam('');
                  setEditPlayerName('');
                  setEditPlayerNewName('');
                  setEditPlayerNewNumber('');
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowEditPlayer(false);
                  setEditPlayerTeam('');
                  setEditPlayerName('');
                  setEditPlayerNewName('');
                  setEditPlayerNewNumber('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    );
  }

  const actionButtons = [
    { label: 'Make 3PT', stat: 'points', value: 3, type: 'threeMade' },
    { label: 'Miss 3PT', stat: 'threeAttempted', value: 1, type: 'threeMissed' },
    { label: 'Make 2PT', stat: 'points', value: 2, type: 'fgMade' },
    { label: 'Miss 2PT', stat: 'fgAttempted', value: 1, type: 'fgMissed' },
    { label: 'Make FT', stat: 'points', value: 1, type: 'ftMade' },
    { label: 'Miss FT', stat: 'ftAttempted', value: 1, type: 'ftMissed' },
    { label: 'Assist', stat: 'assists', value: 1 },
    { label: 'Turnover', stat: 'turnovers', value: 1 },
    { label: 'Def Rebound', stat: 'defRebounds', value: 1 },
    { label: 'Off Rebound', stat: 'offRebounds', value: 1 },
    { label: 'Block', stat: 'blocks', value: 1 },
    { label: 'Steal', stat: 'steals', value: 1 },
    { label: 'Foul', stat: 'fouls', value: 1 },
    { label: 'Substitution', type: 'substitution' }
  ];

  // Handle stat click to update stats and play-by-play
  const handleStatClick = (playerName, playerNumber) => {
    if (!selectedStat) return;
    setHistory(prev => [...prev, { playerName, ...selectedStat }]);
    setPlayByPlay(prev => [`P${period}: ${selectedStat.label} - #${playerNumber} ${playerName}`, ...prev]);

    setStats(prev => {
      const updated = { ...prev };
      const pStats = { ...updated[playerName] };

      if (selectedStat.label.startsWith('Make')) {
        if (selectedStat.label.includes('3PT')) {
          pStats.points += 3;
          pStats.fgMade += 1;
          pStats.fgAttempted += 1;
          pStats.threeMade += 1;
          pStats.threeAttempted += 1;
        } else if (selectedStat.label.includes('2PT')) {
          pStats.points += 2;
          pStats.fgMade += 1;
          pStats.fgAttempted += 1;
        } else if (selectedStat.label.includes('FT')) {
          pStats.points += 1;
          pStats.ftMade += 1;
          pStats.ftAttempted += 1;
        }
      } else if (selectedStat.label.startsWith('Miss')) {
        if (selectedStat.label.includes('3PT')) {
          pStats.fgAttempted += 1;
          pStats.threeAttempted += 1;
        } else if (selectedStat.label.includes('2PT')) {
          pStats.fgAttempted += 1;
        } else if (selectedStat.label.includes('FT')) {
          pStats.ftAttempted += 1;
        }
      } else {
        pStats[selectedStat.stat] = (pStats[selectedStat.stat] || 0) + selectedStat.value;
      }

      updated[playerName] = pStats;
      return updated;
    });
    setSelectedStat(null);
  };

  const undoLast = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];

    setHistory(prev => prev.slice(0, -1));
    setPlayByPlay(prev => prev.slice(1));

    if (last.type === 'substitution' && last.prevActive && last.newActive) {
      setActivePlayers(last.prevActive);
      return;
    }

    // Handle stat undo
    setStats(prev => {
      const playerStats = { ...prev[last.playerName] };

      if (last.label === 'Make 2PT') {
        playerStats.points = Math.max(playerStats.points - 2, 0);
        playerStats.fgMade = Math.max(playerStats.fgMade - 1, 0);
        playerStats.fgAttempted = Math.max(playerStats.fgAttempted - 1, 0);
      } else if (last.label === 'Make 3PT') {
        playerStats.points = Math.max(playerStats.points - 3, 0);
        playerStats.fgMade = Math.max(playerStats.fgMade - 1, 0);
        playerStats.fgAttempted = Math.max(playerStats.fgAttempted - 1, 0);
        playerStats.threeMade = Math.max(playerStats.threeMade - 1, 0);
        playerStats.threeAttempted = Math.max(playerStats.threeAttempted - 1, 0);
      } else if (last.label === 'Make FT') {
        playerStats.points = Math.max(playerStats.points - 1, 0);
        playerStats.ftMade = Math.max(playerStats.ftMade - 1, 0);
        playerStats.ftAttempted = Math.max(playerStats.ftAttempted - 1, 0);
      } else if (last.label === 'Miss 2PT') {
        playerStats.fgAttempted = Math.max(playerStats.fgAttempted - 1, 0);
      } else if (last.label === 'Miss 3PT') {
        playerStats.fgAttempted = Math.max(playerStats.fgAttempted - 1, 0);
        playerStats.threeAttempted = Math.max(playerStats.threeAttempted - 1, 0);
      } else if (last.label === 'Miss FT') {
        playerStats.ftAttempted = Math.max(playerStats.ftAttempted - 1, 0);
      } else {
        const key = last.stat;
        playerStats[key] = Math.max((playerStats[key] || 0) - last.value, 0);
      }

      return {
        ...prev,
        [last.playerName]: playerStats,
      };
    });
  };

   const calculateTeamTotals = (teamKey) => {
    const totals = {
      points: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0,
      ftMade: 0, ftAttempted: 0, offRebounds: 0, defRebounds: 0, assists: 0,
      steals: 0, blocks: 0, fouls: 0, turnovers: 0
    };
    teams[teamKey].forEach(p => {
      const s = stats[p['Player Name']];
      if (s) {
        Object.keys(totals).forEach(key => {
          totals[key] += s[key] || 0;
        });
      }
    });
    return totals;
  };

  const downloadBoxScoreToCSV = () => {
  if (!stats || Object.keys(stats).length === 0) return;

  const headers = [
    'game_id',
    'team',
    'name',
    'number',
    'points',
    'fg_made', 'fg_att',
    'three_made', 'three_att',
    'ft_made', 'ft_att',
    'off_reb', 'def_reb',
    'assists', 'steals', 'blocks',
    'fouls', 'turnovers',
  ];

  // Create a lookup from player name to team name
  const playerTeamMap = {};
  teams.teamA.forEach(p => playerTeamMap[p['Player Name']] = matchup.home);
  teams.teamB.forEach(p => playerTeamMap[p['Player Name']] = matchup.away);

  // a lookup from player name to their number
  const playerNumberMap = {};
  teams.teamA.forEach(p => playerNumberMap[p['Player Name']] = p.Number);
  teams.teamB.forEach(p => playerNumberMap[p['Player Name']] = p.Number);

  const rows = [];
  const teamSums = {};

  for (const [name, s] of Object.entries(stats)) {
    const team = playerTeamMap[name] || 'Unknown';
    rows.push([
      matchup.home+'_'+matchup.away+'_'+matchup.date+'_court'+matchup.court,
      team.split(' -- ')[0],
      name, playerNumberMap[name] ?? null, // Use null if number is not found
      s.points,
      s.fgMade, s.fgAttempted,
      s.threeMade, s.threeAttempted,
      s.ftMade, s.ftAttempted,
      s.offRebounds, s.defRebounds,
      s.assists, s.steals, s.blocks,
      s.fouls, s.turnovers,
    ]);

    // Aggregate team totals
    if (!teamSums[team]) {
      teamSums[team] = {
        points: 0, fgMade: 0, fgAttempted: 0,
        threeMade: 0, threeAttempted: 0,
        ftMade: 0, ftAttempted: 0,
        offRebounds: 0, defRebounds: 0,
        assists: 0, steals: 0, blocks: 0,
        fouls: 0, turnovers: 0
      };
    }

    for (let key in teamSums[team]) {
      teamSums[team][key] += s[key] || 0;
    }
  };

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = matchup.home+'_'+matchup.away+'_'+matchup.date+'_court'+matchup.court+'.csv';
  a.click();

  URL.revokeObjectURL(url);
};

function formatStatsForExport(stats, rosters, gameId) {
  const allStats = [];

  Object.entries(stats).forEach(([playerName, playerStats]) => {
    // Find which team this player belongs to
    let teamKey = null;
    let number = null;
    for (const [key, roster] of Object.entries(rosters)) {
      const player = roster.find(p => p['Player Name'] === playerName);
      if (player) {
        teamKey = key;
        number = player.Number || null;
        break;
      }
    }

    allStats.push({
      game_id: gameId,
      team: teamKey.split(' -- ')[0], // Get team name without Boys / Girls
      name: playerName,
      number: number,
      points: playerStats.points || 0,
      fg_made: playerStats.fgMade || 0,
      fg_att: playerStats.fgAttempted || 0,
      three_made: playerStats.threeMade || 0,
      three_att: playerStats.threeAttempted || 0,
      ft_made: playerStats.ftMade || 0,
      ft_att: playerStats.ftAttempted || 0,
      off_reb: playerStats.offRebounds || 0,
      def_reb: playerStats.defRebounds || 0,
      assists: playerStats.assists || 0,
      steals: playerStats.steals || 0,
      blocks: playerStats.blocks || 0,
      fouls: playerStats.fouls || 0,
      turnovers: playerStats.turnovers || 0,
    });
  });

  return allStats;
}



    // Helper to get button color based on stat type/label
    const getActionButtonStyle = (btn) => {
      // Misses: pastel red
      if (btn.label && btn.label.startsWith('Miss') || btn.label === 'Foul' || btn.label === 'Turnover') {
      return { background: '#f25c5c'};
      }
      // Makes and Assist: pastel green
      if (
      (btn.label && btn.label.startsWith('Make')) ||
      btn.label === 'Assist'
      ) {
      return { background: '#41b551'};
      }
      // Defense: Block, Steal (orange)
      if (btn.label === 'Block' || btn.label === 'Steal') {
      return { background: '#f5a22f'};
      }
      // Rebounds and Substitution (keep original)
      if (
      btn.label === 'Def Rebound' ||
      btn.label === 'Off Rebound' ||
      btn.label === 'Substitution'
      ) {
      return { background: '#6366f1', color: '#fff'};
      }
      // Default
      return {};
    };

  // Render the main tracking interface
  if (stage === 'tracking') {
    return (
      <div>
        <div className="main-header">
          <h1>🏀 Hoop Tracker</h1>
        </div>
        <div>
          <h3>Game Period: {period}</h3>
          <button onClick={() => setPeriod(q => Math.max(1, q - 1))}>-</button>
          <button onClick={() => setPeriod(q => Math.min(4, q + 1))}>+</button>
        </div>
        <br />

        <div>
          {!selectedStat && actionButtons.map(btn => (
            <button
              key={btn.label}
              onClick={() => setSelectedStat(btn)}
              style={{
                ...getActionButtonStyle(btn),
                marginRight: 8,
                marginBottom: 8,
                padding: '0.5rem 1.2rem',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                outline: selectedStat && selectedStat.label === btn.label ? '2px solid #000' : undefined,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {selectedStat && selectedStat.label === 'Substitution' && (
          <div>
            <h2>Select Active Lineup</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32 }}>
              {['teamA', 'teamB'].map(teamKey => {
                const teamPlayers = teams[teamKey];
                const selected = subSelection[teamKey] || [];
                return (
                  <div key={teamKey} style={{ flex: 1 }}>
                    <h3>{teamKey === 'teamA' ? matchup.home : matchup.away}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {teamPlayers.map(player => {
                        const isSelected = selected.some(p => p['Player Name'] === player['Player Name']);
                        return (
                          <button
                            key={player['Player Name']}
                            style={{
                              minWidth: 120,
                              background: isSelected ? '#6366f1' : '#eee',
                              color: isSelected ? '#fff' : '#222',
                              border: isSelected ? '2px solid #6366f1' : '1px solid #ccc',
                              borderRadius: 6,
                              fontWeight: 600,
                              padding: '6px 12px',
                            }}
                            onClick={() => {
                              setSubSelection(prev => {
                                const already = prev[teamKey]?.some(p => p['Player Name'] === player['Player Name']);
                                let updated;
                                if (already) {
                                  updated = prev[teamKey].filter(p => p['Player Name'] !== player['Player Name']);
                                } else {
                                  updated = [...(prev[teamKey] || []), player];
                                }
                                // Only allow max 5
                                if (updated.length > 5) return prev;
                                return { ...prev, [teamKey]: updated };
                              });
                              setSubTeamKey(teamKey);
                            }}
                          >
                            #{player.Number} {player['Player Name']}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                      Selected: {(subSelection[teamKey] || []).length}/5
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 24 }}>
              <button
                disabled={
                  !subSelection.teamA || !subSelection.teamB ||
                  subSelection.teamA.length !== 5 || subSelection.teamB.length !== 5
                }
                onClick={() => {
                  // Save previous activePlayers for history
                  const prevActive = {
                    teamA: activePlayers.teamA,
                    teamB: activePlayers.teamB
                  };
                  setActivePlayers({
                    teamA: subSelection.teamA,
                    teamB: subSelection.teamB
                  });
                  setHistory(prev => [
                    ...prev,
                    {
                      type: 'substitution',
                      prevActive,
                      newActive: { teamA: subSelection.teamA, teamB: subSelection.teamB }
                    }
                  ]);
                  setPlayByPlay(prev => [
                    `P${period}: Substitution - New lineup set`,
                    ...prev
                  ]);
                  setSelectedStat(null);
                  setSubSelection({ teamA: [], teamB: [] });
                  setSubTeamKey(null);
                }}
                style={{
                  background: '#6366f1',
                  color: '#fff',
                  padding: '8px 24px',
                  borderRadius: 6,
                  fontWeight: 600,
                  marginRight: 12
                }}
              >
                Confirm Lineup
              </button>
              <button
                onClick={() => {
                  setSelectedStat(null);
                  setSubSelection({ teamA: [], teamB: [] });
                  setSubTeamKey(null);
                }}
                style={{
                  background: '#eee',
                  color: '#222',
                  padding: '8px 24px',
                  borderRadius: 6,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedStat && selectedStat.label !== 'Substitution' && (
          <div>
            <h2>Select a player for: {selectedStat.label}</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
              {['teamA', 'teamB'].map((teamKey, idx) => {
                const isRight = teamKey === 'teamB';
                return (
                  <div
                    key={teamKey}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isRight ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <h3 style={{ textAlign: isRight ? 'right' : 'left', width: '100%' }}>
                      {teamKey === 'teamA' ? matchup.home : matchup.away}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start', gap: 8 }}>
                      {activePlayers[teamKey].map(player => (
                        <button
                          key={player['Player Name']}
                          onClick={() => handleStatClick(player['Player Name'], player.Number)}
                          style={{
                            minWidth: 160,
                            textAlign: isRight ? 'right' : 'left'
                          }}
                        >
                          #{player.Number} {player['Player Name']}
                        </button>
                      ))}
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          )}

            {/* Play-by-Play and Undo */}
            <div className="play-by-play-box">
              <h2>Play-by-Play</h2>
              <div className="play-log">
              {playByPlay.map((event, i) => (
                <div key={i}>{event}</div>
              ))}
              </div>
            </div>

            <br />
            <button onClick={undoLast}>
              Undo Last Action
            </button>
            <button onClick={() => setShowAddKnownPlayer(true)} style={{ marginLeft: 8 }}>
              Add Player
            </button>
            <button onClick={() => setShowAddPlayer(true)} style={{ marginLeft: 8 }}>
              Add Unknown Player
            </button>
            <div>
              <div>
              {['teamA', 'teamB'].map(teamKey => {
              const total = calculateTeamTotals(teamKey);
              const bench = teams[teamKey].filter(p => !activePlayers[teamKey].includes(p));

              return (
                <div key={teamKey}>
                  <h2>{teamKey === 'teamA' ? matchup.home : matchup.away}</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>PLAYER</th>
                        <th>PTS</th>
                        <th>FG</th>
                        <th>3PT</th>
                        <th>FT</th>
                        <th>OREB</th>
                        <th>DREB</th>
                        <th>AST</th>
                        <th>STL</th>
                        <th>BLK</th>
                        <th>FOUL</th>
                        <th>TO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...teams[teamKey]].map((p) => (
                        <tr key={p['Player Name']} className="text-center">
                          <td>{p.Number}</td>
                          <td>{p['Player Name']}</td>
                          <td>{stats[p['Player Name']].points}</td>
                          <td>{stats[p['Player Name']].fgMade}/{stats[p['Player Name']].fgAttempted}</td>
                          <td>{stats[p['Player Name']].threeMade}/{stats[p['Player Name']].threeAttempted}</td>
                          <td>{stats[p['Player Name']].ftMade}/{stats[p['Player Name']].ftAttempted}</td>
                          <td>{stats[p['Player Name']].offRebounds}</td>
                          <td>{stats[p['Player Name']].defRebounds}</td>
                          <td>{stats[p['Player Name']].assists}</td>
                          <td>{stats[p['Player Name']].steals}</td>
                          <td>{stats[p['Player Name']].blocks}</td>
                          <td>{stats[p['Player Name']].fouls}</td>
                          <td>{stats[p['Player Name']].turnovers}</td>
                        </tr>
                      ))}
                      <tr className="text-center">
                        <td colSpan="2">Total</td>
                        <td>{total.points}</td>
                        <td>{total.fgMade}/{total.fgAttempted}</td>
                        <td>{total.threeMade}/{total.threeAttempted}</td>
                        <td>{total.ftMade}/{total.ftAttempted}</td>
                        <td>{total.offRebounds}</td>
                        <td>{total.defRebounds}</td>
                        <td>{total.assists}</td>
                        <td>{total.steals}</td>
                        <td>{total.blocks}</td>
                        <td>{total.fouls}</td>
                        <td>{total.turnovers}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
          <br />
          <button
            className="export-button"
            onClick={async () => {
              try {
                const gameId = `${matchup.home} ${matchup.away} ${matchup.date}_court${matchup.court}`;

                const formattedStats = formatStatsForExport(stats, rosters, gameId);

                console.log('Formatted payload example:', formattedStats[0]);

                const response = await fetch('/api/exportBoxScore', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ rows: formattedStats, eventKey: selectedEvent?.value }),
                });

                const result = await response.json();
                alert(result.message);
              } catch (err) {
                console.error('Export failed', err);
                alert('Failed to export box score');
              }
            }}
          >
            Export Box Score
          </button>
          <button onClick={downloadBoxScoreToCSV}>
            Download Box Score
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={() => setStage('starters')}>
            Back to Starters
          </button>
        </div>
        </div>

        {showAddKnownPlayer && (
  <div style={{
    background: 'rgba(0,0,0,0.3)',
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: '#fff',
      padding: 24,
      borderRadius: 8,
      minWidth: 300,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
    }}>
      <h3>Add Known Player</h3>
      <div>
        <label>
          Team:
          <select
            value={addPlayerTeam}
            onChange={e => setAddPlayerTeam(e.target.value)}
            style={{ marginLeft: 8, marginBottom: 8 }}
          >
            <option value="">Select Team</option>
            <option value="teamA">{matchup.home}</option>
            <option value="teamB">{matchup.away}</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={addPlayerName}
            onChange={e => setAddPlayerName(e.target.value)}
            style={{ marginLeft: 8, width: 140 }}
          />
        </label>
      </div>
      <div>
        <label>
          Number:
          <input
            type="text"
            value={addPlayerNumber}
            onChange={e => setAddPlayerNumber(e.target.value)}
            style={{ marginLeft: 8, width: 60 }}
          />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            if (!addPlayerTeam || !addPlayerName.trim() || !addPlayerNumber.trim()) return;
            const newPlayer = { 'Player Name': addPlayerName.trim(), Number: addPlayerNumber.trim() };
            setTeams(prev => ({
              ...prev,
              [addPlayerTeam]: [...prev[addPlayerTeam], newPlayer]
            }));
            setRosters(prev => ({
              ...prev,
              [addPlayerTeam === 'teamA' ? matchup.home : matchup.away]: [
                ...(prev[addPlayerTeam === 'teamA' ? matchup.home : matchup.away] || []),
                newPlayer
              ]
            }));
            setStats(prev => ({
              ...prev,
              [newPlayer['Player Name']]: {
                points: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0,
                blocks: 0, fouls: 0, turnovers: 0,
                fgMade: 0, fgAttempted: 0,
                threeMade: 0, threeAttempted: 0,
                ftMade: 0, ftAttempted: 0,
              }
            }));
            setShowAddKnownPlayer(false);
            setAddPlayerTeam('');
            setAddPlayerName('');
            setAddPlayerNumber('');
          }}
          style={{ marginRight: 8 }}
        >
          Add
        </button>
        <button onClick={() => {
          setShowAddKnownPlayer(false);
          setAddPlayerTeam('');
          setAddPlayerName('');
          setAddPlayerNumber('');
        }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

        {showAddPlayer && (
  <div style={{
    background: 'rgba(0,0,0,0.3)',
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: '#fff',
      padding: 24,
      borderRadius: 8,
      minWidth: 300,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
    }}>
      <h3>Add Unknown Player</h3>
      <div>
        <label>
          Team:
          <select
            value={addPlayerTeam}
            onChange={e => setAddPlayerTeam(e.target.value)}
            style={{ marginLeft: 8, marginBottom: 8 }}
          >
            <option value="">Select Team</option>
            <option value="teamA">{matchup.home}</option>
            <option value="teamB">{matchup.away}</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Number:
          <input
            type="text"
            value={addPlayerNumber}
            onChange={e => setAddPlayerNumber(e.target.value)}
            style={{ marginLeft: 8, width: 60 }}
          />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            if (!addPlayerTeam || !addPlayerNumber.trim()) return;
            // Find next unique Unknown N ACROSS BOTH TEAMS
            const allPlayers = [...teams.teamA, ...teams.teamB];
            let n = 1;
            let name;
            do {
              name = `Unknown ${n}`;
              n++;
            } while (allPlayers.some(p => p['Player Name'] === name));
            const newPlayer = { 'Player Name': name, Number: addPlayerNumber.trim() };
            // Add to teams and rosters, but not activePlayers
            setTeams(prev => ({
              ...prev,
              [addPlayerTeam]: [...prev[addPlayerTeam], newPlayer]
            }));
            setRosters(prev => ({
              ...prev,
              [addPlayerTeam === 'teamA' ? matchup.home : matchup.away]: [
                ...(prev[addPlayerTeam === 'teamA' ? matchup.home : matchup.away] || []),
                newPlayer
              ]
            }));
            setStats(prev => ({
              ...prev,
              [newPlayer['Player Name']]: {
                points: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0,
                blocks: 0, fouls: 0, turnovers: 0,
                fgMade: 0, fgAttempted: 0,
                threeMade: 0, threeAttempted: 0,
                ftMade: 0, ftAttempted: 0,
              }
            }));
            setShowAddPlayer(false);
            setAddPlayerTeam('');
            setAddPlayerNumber('');
          }}
          style={{ marginRight: 8 }}
        >
          Add
        </button>
        <button onClick={() => { setShowAddPlayer(false); setAddPlayerTeam(''); setAddPlayerNumber(''); }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    );
}
}

function AddPlayerButton({ teamKey, teamName, onAdd }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');

  return (
    <>
      <button onClick={() => setShow(true)}>
        Add Player
      </button>
      {show && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            minWidth: 300,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}>
            <h3>Add Player to {teamName}</h3>
            <div style={{ marginTop: 8, color: '#6366f1', fontWeight: 500 }}>
              Enter the player's name and number. Ensure player names are unique.
            </div>
            <div style={{ marginTop: 16 }}>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ marginRight: 8, width: 140 }}
              />
              <input
                type="text"
                placeholder="Number"
                value={number}
                onChange={e => setNumber(e.target.value)}
                style={{ width: 60 }}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => {
                  if (!name.trim()) return;
                  onAdd({
                    'Player Name': name.trim(),
                    Number: number.trim()
                  });
                  setName('');
                  setNumber('');
                  setShow(false);
                }}
                style={{ marginRight: 8 }}
              >
                Save
              </button>
              <button onClick={() => setShow(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}