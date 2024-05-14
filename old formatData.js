function formatPlayerData(team, previousData) {
            const tableId = `team${team}`;
            const table = document.getElementById(tableId);
            const tbody = table.querySelector('tbody');
            if (window.playerData[`team${team}`] && window.playerData[`team${team}`].length > 0) {
                while (tbody.children.length > 1) {
                    tbody.removeChild(tbody.children[1]);
                }
            }
            if (window.playerData[`team${team}`] && Array.isArray(window.playerData[`team${team}`])) {
                closeTooltip();
                // Sort player data by fantasy
                const sortedPlayers = window.playerData[`team${team}`].sort((a, b) => b.fantasy - a.fantasy);
                //const sortedPlayers = window.playerData[`team${team}`].sort(() => Math.random() - 0.5);

                sortedPlayers.forEach(player => {

                    if (player.team === team) { // Filter players by team
                        const row = document.createElement('tr');

                        const playerId = `${player.name}-${player.number}`;

                        const previousColour = rowColours[playerId];
                        if (previousColour) {
                            row.style.backgroundColor = previousColour;
                        }

                        const differences = calculateDifferences(player, previousData[playerId]);

                        row.innerHTML = `
                            <td class="playerName">${player.number} ${player.name}</td>
                            <td>${player.goals}${renderSuperscript(differences.goals)}.${player.behinds}${renderSuperscript(differences.behinds)}</td>
                            <td>${player.kicks}${renderSuperscript(differences.kicks)}</td>
                            <td>${player.handballs}${renderSuperscript(differences.handballs)}</td>
                            <td>${player.marks}${renderSuperscript(differences.marks)}</td>
                            <td>${player.tackles}${renderSuperscript(differences.tackles)}</td>
                            <td>${player.hitouts}${renderSuperscript(differences.hitouts)}</td>
                            <td>${player.tog}%</td>
                            <td>${player.fantasyAvg}</td>
                            <td>${player.fantasy}${renderSuperscript(differences.fantasy)}</td>
                        `;
                        tbody.appendChild(row);
                        row.id = playerId;

                        const previousIcon = rowIcons[playerId];
                        if (previousIcon) {
                            addIcon(row, previousIcon);
                        }

                        const fantasyDifference = differences.fantasy;
                        const anyStatChanged = Object.values(differences).some(diff => diff !== 0);

                        if (row.style.backgroundColor == '') {
                            setTimeout(() => {
                                if (row.style.backgroundColor == '' || row.style.backgroundColor == 'lightgreen' || row.style.backgroundColor == 'lightcoral') {
                                    row.style.backgroundColor = ''; // Reset background color after 3 seconds
                                    row.querySelectorAll('sup').forEach(sup => {
                                        sup.style.visibility = 'hidden'; // Hide superscripts
                                    });
                                    allowColourChange = true;
                                }
                            }, 3000);

                            if (fantasyDifference > 0) {
                                row.style.backgroundColor = 'lightgreen'; // Green for increase
                                setTimeout(() => {
                                    if (row.style.backgroundColor == '' || row.style.backgroundColor == 'lightgreen' || row.style.backgroundColor == 'lightcoral') {
                                        row.style.backgroundColor = ''; // Reset after 3 seconds
                                        allowColourChange = true; // Reset allowColourChange
                                    }
                                }, 3000);
                                allowColourChange = false;
                            } else if (fantasyDifference < 0) {
                                row.style.backgroundColor = 'lightcoral'; // Red for decrease
                                setTimeout(() => {
                                    if (row.style.backgroundColor == '' || row.style.backgroundColor == 'lightgreen' || row.style.backgroundColor == 'lightcoral') {
                                        row.style.backgroundColor = ''; // Reset after 3 seconds
                                        allowColourChange = true; // Reset allowColourChange
                                    }
                                }, 3000);
                            }
                            else if (Object.values(differences).some(diff => diff !== 0)) {
                                // Check if any stat has changed
                                row.querySelectorAll('sup').forEach(sup => {
                                    sup.style.visibility = 'visible'; // Show superscripts for changed stats
                                });
                                allowColourChange = false;
                            }
                        }


                        if (rowColours[playerId]) {
                            //row.style.backgroundColor = rowColours[playerId];
                            switch (rowColours[playerId]) {
                                case 'default':
                                    row.style.backgroundColor = '';
                                    break;
                                case 'orange':
                                    row.style.backgroundColor = '#ffa600';
                                    break;
                                case 'blue':
                                    row.style.backgroundColor = '#007bff';
                                    break;
                                case 'purple':
                                    row.style.backgroundColor = 'rgb(166, 140, 208)';
                                    break;
                                default:
                                    break;
                            }
                        }

                        // Add event listener to toggle row background color
                        row.querySelector(".playerName").addEventListener('click', function () {
                            var x = event.clientX;
                            var y = event.clientY;
                            showTooltip(playerId, player.team, row, x, y);
                        });
                    }
                });
            } else {
                console.error(`Player data for Team ${team} is not available or not in the expected format.`);
            }
        }