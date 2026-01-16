  let hasUserInput = false;

    const events = {
        "800m": 800,
        "1500m": 1500,
        "Mile": 1609.34,
        "3,000m": 3000,
        "5,000m": 5000,
        "10,000m": 10000
    };

    // Set default lap length to outdoor track (400m)
    let lap_length = 400;

    function changeLapLength() {
        const selected = document.querySelector('input[name="track-length"]:checked');

        if (!selected) return;

        lap_length = parseInt(selected.value);
        calculateSplits();
    }

    function onFirstInput() {
        hasUserInput = true;
        calculateSplits();
    }

    // Loads the radio buttons 
    function loadContent() {
        let event_buttons = "";

        Object.entries(events).forEach(([event, distance]) => {
            event_buttons += `
               <label>
                <input type="radio" name="event" class="event-button" value="${distance}">
                <span>${event}</span>
            </label>
        `;
        });

        document.getElementById("event-buttons").innerHTML = event_buttons;

    }



    // Convert elapsed time in seconds to "minutes:seconds" format
    function formatter(elapsed_time) {
        let minutes = Math.floor(elapsed_time / 60);
        let seconds = elapsed_time % 60;
        return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
    }



    function calculateSplits() {
        // Check to see if there is user input 
        if (!hasUserInput) return;

        const goal_hours = document.getElementById("goal_hours").value;
        const goal_minutes = document.getElementById("goal_minutes").value;
        const goal_seconds = document.getElementById("goal_seconds").value;
        // const lap_length = document.getElementById("lap_length").value;

        const hours = parseInt(goal_hours) || 0;
        const minutes = parseInt(goal_minutes) || 0;
        const seconds = parseFloat(goal_seconds) || 0;

        // Get custom distance (if provided)
        const customDistanceInput = document.getElementById("custom-distance").value;
        const customDistance = parseFloat(customDistanceInput);

        // Get selected preset event
        const selectedEvent = document.querySelector('input[name="event"]:checked');

        let event;

        // Priority: custom distance
        if (!isNaN(customDistance) && customDistance > 0) {
            event = customDistance;
        }
        // Fallback: radio button
        else if (selectedEvent) {
            event = parseFloat(selectedEvent.value);
        }

        const total_seconds = (hours * 3600) + (minutes * 60) + seconds;

        // Prevent division by zero
        if (total_seconds === 0) return;

        const seconds_per_meter = total_seconds / event;


        const goal_time =
            hours > 0
                ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                : `${minutes}:${String(seconds).padStart(2, '0')}`;

        let meters_run = 0;
        let elapsed_time = 0;

        let result_table = `            
        <thead>
                <tr>
                    <th>Lap</th>
                    <th>Distance</th>
                    <th>Split</th>
                    <th>Cumulative</th>
                </tr>
            </thead>`;

        let lap = 0;

        // Loop until we reach the total distance
        while (meters_run < event - 0.1) {
            lap++;

            let lap_distance;

            // === LOGIC FLIP ===
            if (lap === 1) {
                // Calculate the "start offset" (the remainder)
                const remainder = event % lap_length;


                lap_distance = remainder > 0.1 ? remainder : lap_length;
            } else {
                // All subsequent laps are standard 400m chunks
                lap_distance = Math.min(lap_length, event - meters_run);
            }

            elapsed_time += lap_distance * seconds_per_meter;
            meters_run += lap_distance;

            result_table += `
                <tr>
                    <td>${lap}</td>
                    <td>${Math.round(meters_run)}m</td>
                    <td>${(lap_distance * seconds_per_meter).toFixed(2)}s (${Math.round(lap_distance)}m)</td>
                    <td>${formatter(elapsed_time)}</td>
                </tr>
            `;
        }

        document.getElementById("result").innerHTML = result_table;


    }

    window.addEventListener('DOMContentLoaded', () => {

        // Load buttons only (safe to do immediately)
        loadContent();
        // Grab elements AFTER loadContent() runs

        const trackLengthRadios = document.querySelectorAll('input[name="track-length"]');

        trackLengthRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                changeLapLength();
            });
        });

        const customInput = document.getElementById('custom-distance');
        const radioButtons = document.querySelectorAll('input[name="event"]');
        const allInputs = document.querySelectorAll('#goal_input input, #custom-distance, input[name="event"]');

        const inputs = document.querySelectorAll(
            '#goal_input input, #custom-distance, input[name="event"]'
        );

        // 1. When typing in Custom Distance -> Uncheck all radio buttons
        customInput.addEventListener('input', () => {
            radioButtons.forEach(btn => {
                btn.checked = false; // This removes the red highlight
            });
        });

        // 2. When clicking a Radio Button -> Clear Custom Distance
        radioButtons.forEach(btn => {
            btn.addEventListener('change', () => {
                customInput.value = ''; // Clear the text box
                calculateSplits();      // Recalculate immediately
            });
        });

        inputs.forEach(input => {

            // First interaction
            input.addEventListener('input', () => {
                if (!hasUserInput) {
                    onFirstInput();
                } else {
                    calculateSplits();
                }
            });

            // Radio buttons use change instead of input
            input.addEventListener('change', () => {
                if (!hasUserInput) {
                    onFirstInput();
                } else {
                    calculateSplits();
                }
            });
        });
    });
