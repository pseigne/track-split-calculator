let hasUserInput = false;
let lap_length = 400; // Default to standard track

const events = {
    "800m": 800,
    "1500m": 1500,
    "Mile": 1609.34,
    "3,000m": 3000,
    "5,000m": 5000,
    "10,000m": 10000,
    "Other": 0
};


function displayCustomLapLength() {
    const otherButton = document.getElementById("radio-custom"); otherButton.checked = true;
    const container = document.getElementById('custom-track-div');
    // Create the input
    container.innerHTML = `<input id="custom-track-input" type="number" min="1" step="1" placeholder="e.g. 300">`;

    const newInput = document.getElementById('custom-track-input');
    newInput.addEventListener('input', () => {
        changeLapLength();
    });
}

function changeLapLength() {
    const selectedRadio = document.querySelector('input[name="track-length"]:checked');
    const customInputEl = document.getElementById('custom-track-input');

    // FIXED: Check if the custom input actually exists to avoid crashing
    let customVal = customInputEl ? parseFloat(customInputEl.value) : NaN;

    // FIXED: Priority Logic
    // If "Other" radio is checked, use the custom input value
    if (selectedRadio && selectedRadio.id === 'radio-custom') {
        if (!isNaN(customVal) && customVal > 0) {
            lap_length = customVal;
        }
    }
    // Otherwise use the preset radio value (400m, 200m, etc)
    else if (selectedRadio) {
        lap_length = parseInt(selectedRadio.value);
        // Optional: Clear the custom input visually so it's not confusing
        if (customInputEl) customInputEl.value = "";
    }

    calculateSplits();
}


function displayCustomDistance() {
    let innerHTML = ` 
            <h5>Custom Distance (meters):</h5>
            <input id="custom-distance" type="number" min="1" step="1" placeholder="e.g. 1200">`;
    const customDistanceContainer = document.getElementById("custom-distance-div");

    customDistanceContainer.innerHTML = innerHTML;
    const input = document.getElementById("custom-distance");
    input.addEventListener('input', calculateSplits);

}


function customRaceDistance() {

}

function onFirstInput() {
    hasUserInput = true;
    calculateSplits();
}

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

function formatter(elapsed_time) {
    let minutes = Math.floor(elapsed_time / 60);
    let seconds = elapsed_time % 60;
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function calculateSplits() {
    if (!hasUserInput) return;

    const goal_hours = parseInt(document.getElementById("goal_hours").value) || 0;
    const goal_minutes = parseInt(document.getElementById("goal_minutes").value) || 0;
    const goal_seconds = parseFloat(document.getElementById("goal_seconds").value) || 0;

    const customDistInput = document.getElementById("custom-distance");
    const customDistance = customDistInput ? parseFloat(customDistInput.value) : 0;


    const selectedEvent = document.querySelector('input[name="event"]:checked');

    let event;

    if (selectedEvent && selectedEvent.value == "0") {
        event = customDistance;
    } else if (selectedEvent) {
        event = parseFloat(selectedEvent.value);
    } else {
        return;
    }


    // Priority: Custom distance takes precedence
    if (!isNaN(customDistance) && customDistance > 0) {
        event = customDistance;
    } else if (selectedEvent) {
        event = parseFloat(selectedEvent.value);
    } else {
        return;
    }

    // event = customRaceDistance();

    const total_seconds = (goal_hours * 3600) + (goal_minutes * 60) + goal_seconds;
    if (total_seconds === 0) return;

    const seconds_per_meter = total_seconds / event;

    let meters_run = 0;
    let elapsed_time = 0;
    let result_table = `<thead><tr><th>Lap</th><th>Distance</th><th>Split</th><th>Cumulative</th></tr></thead>`;
    let lap = 0;

    while (meters_run < event - 0.1) {
        lap++;
        let lap_distance;

        // Logic for staggered start
        if (lap === 1) {
            const remainder = event % lap_length;
            lap_distance = remainder > 0.1 ? remainder : lap_length;
        } else {
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
    loadContent();

    //  Setup Track Length Radios (Standard vs Custom)
    // NOTE: Make sure your "Other" radio button in HTML has id="radio-custom"
    const trackLengthRadios = document.querySelectorAll('input[name="track-length"]');
    trackLengthRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.id === 'radio-custom') {
                displayCustomLapLength();
            } else {
                // Remove custom input if they switch back to standard
                document.getElementById('custom-track-div').innerHTML = '';
                changeLapLength();
            }
        });
    });

const eventRadios = document.querySelectorAll('input[name="event"]');
    eventRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const container = document.getElementById("custom-distance-div");
            if (e.target.value == "0") {
                displayCustomDistance();
            } else {
                container.innerHTML = ""; // Clear custom input
                calculateSplits();
            }
        });
    });
    
    const goalInputs = document.querySelectorAll('#goal_input input');

    // Helper to handle any input change
    const handleInput = () => {
        if (!hasUserInput) onFirstInput();
        else calculateSplits();
    };




    goalInputs.forEach(input => {
        input.addEventListener('input', handleInput);
    });
});