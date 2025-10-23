// Game state
let characters = [];
let targetCharacter = null;
let guessCount = 0;
let gameActive = false;
let hintIndex = 0; // Track which hint we're on

// DOM Elements
const gameSettings = document.getElementById('gameSettings');
const gameArea = document.getElementById('gameArea');
const characterInput = document.getElementById('characterInput');
const autoComplete = document.getElementById('autoComplete');
const guessRows = document.getElementById('guessRows');
const gameComplete = document.getElementById('gameComplete');
const successMessage = document.getElementById('successMessage');
const playButton = document.getElementById('playButton');
const replayButton = document.getElementById('replayButton');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const settingsClose = document.querySelector('.settings-close');

// Settings Modal Functions
function openSettingsModal() {
    settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

// Settings Modal Event Listeners
settingsButton.addEventListener('click', openSettingsModal);
settingsClose.addEventListener('click', closeSettingsModal);

// Game complete settings button
const gameCompleteSettingsButton = document.getElementById('gameCompleteSettingsButton');
if (gameCompleteSettingsButton) {
    gameCompleteSettingsButton.addEventListener('click', openSettingsModal);
}

// Close modal when clicking outside the content
settingsModal.addEventListener('click', function(event) {
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && settingsModal.style.display === 'flex') {
        closeSettingsModal();
    }
});

// Mobile keyboard handling - browser handles positioning automatically
if (window.innerWidth <= 600) {
    const characterInput = document.getElementById('characterInput');
    let isSelectingAutocomplete = false;
    
    // Prevent keyboard dismissal when tapping autocomplete
    const autoComplete = document.getElementById('autoComplete');
    if (autoComplete) {
        autoComplete.addEventListener('mousedown', function() {
            isSelectingAutocomplete = true;
        });
        
        autoComplete.addEventListener('touchstart', function() {
            isSelectingAutocomplete = true;
        });
        
        // Reset flag after selection
        autoComplete.addEventListener('click', function() {
            setTimeout(() => {
                isSelectingAutocomplete = false;
            }, 200);
        });
    }
    
    // Handle blur events with autocomplete interaction check
    characterInput.addEventListener('blur', function(event) {
        // Delay blur handling to allow autocomplete selection
        setTimeout(() => {
            if (!isSelectingAutocomplete) {
                // Allow natural keyboard dismissal
            }
        }, 150);
    });
}

// Function to check if scroll hint should be visible
function updateScrollHintVisibility() {
    const scrollHint = document.getElementById('scrollHint');
    if (scrollHint && gameActive && guessCount > 0) {
        const tableWrapper = document.querySelector('.table-scroll-wrapper');
        if (tableWrapper && tableWrapper.scrollWidth > tableWrapper.clientWidth) {
            scrollHint.style.display = 'block';
        } else {
            scrollHint.style.display = 'none';
        }
    } else if (scrollHint) {
        scrollHint.style.display = 'none';
    }
}

// Add resize event listener to update scroll hint visibility
window.addEventListener('resize', updateScrollHintVisibility);

// Load character data
async function loadCharacters() {
    try {
        const response = await fetch('assets/database/avatar_characters.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, URL: ${response.url}`);
        }
        const data = await response.json();
        characters = data;
        console.log("Characters loaded:", characters.length);
    } catch (error) {
        console.error('Error loading character data:', error);
    }
}


// Filter characters based on selected appearances
function getFilteredCharacters() {
    const selectedAppearances = [];

    // Shows
    if (document.getElementById('atla').checked) {
        selectedAppearances.push('Avatar: The Last Airbender');
    }
    if (document.getElementById('lok').checked) {
        selectedAppearances.push('The Legend of Korra');
    }

    // Comics - check individual selections
    if (document.getElementById('avatar-comics').checked) {
        selectedAppearances.push('Avatar Comics');
    }
    if (document.getElementById('korra-comics').checked) {
        selectedAppearances.push('Korra Comics');
    }

    // Novels - check individual selections
    if (document.getElementById('kyoshi-novels').checked) {
        selectedAppearances.push('Kyoshi Novels');
    }
    if (document.getElementById('yangchen-novels').checked) {
        selectedAppearances.push('Yangchen Novels');
    }
    if (document.getElementById('roku-novels').checked) {
        selectedAppearances.push('Roku Novels');
    }
    if (document.getElementById('avatar-novels').checked) {
        selectedAppearances.push('Avatar Novels');
    }

    // 🔎 Debug logs
    console.log("Selected appearances:", selectedAppearances);
    console.log("Characters loaded:", characters.length);

    const filtered = characters.filter(char =>
        char.Appearances.some(appearance => selectedAppearances.includes(appearance))
    );

    console.log("Filtered characters:", filtered.length);
    return filtered;
}

// Start new game
function startGame() {
    const filteredCharacters = getFilteredCharacters();
    if (filteredCharacters.length === 0) {
        alert('Please select at least one appearance type');
        return;
    }

    targetCharacter = filteredCharacters[Math.floor(Math.random() * filteredCharacters.length)];
    guessCount = 0;
    gameActive = true;
    
    // Reset hints for new game
    resetHints();
    
    // Show/hide appropriate elements
    gameSettings.style.display = 'none';
    gameArea.style.display = 'block';
    playButton.style.display = 'none';
    characterInput.style.display = 'block';
    guessRows.innerHTML = '';
    gameArea.classList.remove('game-won');
    gameComplete.style.display = 'none';
    characterInput.value = '';
    characterInput.focus();
    
    // Remove game-active class to reset layout for new game
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.remove('game-active');
    }
    
    // Hide column hint text and scroll hint
    const columnHint = document.getElementById('columnHint');
    if (columnHint) {
        columnHint.style.display = 'none';
    }
    
    const scrollHint = document.getElementById('scrollHint');
    if (scrollHint) {
        scrollHint.style.display = 'none';
    }
    
    // Hide character image
    const characterImage = document.getElementById('characterImage');
    if (characterImage) {
        characterImage.style.display = 'none';
        characterImage.src = '';
    }

    // Always show instructions during the game
    const instructions = document.querySelector('.game-instructions');
    if (instructions) {
        instructions.style.display = 'block';
    }

    // Headers and table wrapper will be created on first guess

    // Hide column headers initially until first guess
    const columnHeaders = document.querySelector('.column-headers');
    if (columnHeaders) {
        columnHeaders.style.display = 'none';
    }

    // Remove existing table wrapper from previous games
    const existingTableWrapper = document.querySelector('.table-scroll-wrapper');
    if (existingTableWrapper) {
        existingTableWrapper.remove();
    }
    
    // Re-add guessRows to gameArea if it was removed
    if (!gameArea.contains(guessRows)) {
        gameArea.appendChild(guessRows);
    }

    // Checkboxes are now in the settings modal
    
    // Make sure scroll hint is hidden at start of new game
    updateScrollHintVisibility();
}

// Handle character input and autocomplete
// Add variables for tracking selected suggestion
let currentSuggestionIndex = -1;

// Helper function to normalize text for matching (removes apostrophes and makes lowercase)
function normalizeForMatching(text) {
    return text.toLowerCase().replace(/'/g, '');
}

// Update handleInput function
function handleInput() {
    const input = characterInput.value.toLowerCase();
    const normalizedInput = normalizeForMatching(input);
    autoComplete.innerHTML = '';
    currentSuggestionIndex = -1;

    if (input.length < 2) return;

    const allMatches = getFilteredCharacters()
        .filter(char => {
            const charName = char.Name.toLowerCase();
            const normalizedCharName = normalizeForMatching(char.Name);
            // Match either the original name or the normalized name (without apostrophes)
            return charName.includes(input) || normalizedCharName.includes(normalizedInput);
        });
    
    // Sort matches to prioritize exact matches and matches that start with the input
    const matches = allMatches.sort((a, b) => {
        const aName = a.Name.toLowerCase();
        const bName = b.Name.toLowerCase();
        const aNormalized = normalizeForMatching(a.Name);
        const bNormalized = normalizeForMatching(b.Name);
        
        // Exact match gets highest priority
        if (aName === input || aNormalized === normalizedInput) return -1;
        if (bName === input || bNormalized === normalizedInput) return 1;
        
        // Starts with input gets second priority
        if (aName.startsWith(input) || aNormalized.startsWith(normalizedInput)) return -1;
        if (bName.startsWith(input) || bNormalized.startsWith(normalizedInput)) return 1;
        
        // Then alphabetical order
        return aName.localeCompare(bName);
    }).slice(0, 5);

    matches.forEach((char, index) => {
        const div = document.createElement('div');
        div.textContent = char.Name;
        div.setAttribute('data-index', index);
        div.addEventListener('click', () => selectSuggestion(char));
        autoComplete.appendChild(div);
    });
}

// Add keyboard navigation handling
characterInput.addEventListener('keydown', (e) => {
    const suggestions = autoComplete.children;
    if (suggestions.length === 0) return;

    if (e.key === 'Tab' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSuggestionIndex < suggestions.length - 1) {
            currentSuggestionIndex++;
        } else {
            currentSuggestionIndex = 0;
        }
        
        Array.from(suggestions).forEach((suggestion, index) => {
            if (index === currentSuggestionIndex) {
                suggestion.classList.add('selected');
                suggestion.scrollIntoView({ block: 'nearest' });
            } else {
                suggestion.classList.remove('selected');
            }
        });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSuggestionIndex > 0) {
            currentSuggestionIndex--;
        } else {
            currentSuggestionIndex = suggestions.length - 1;
        }
        
        Array.from(suggestions).forEach((suggestion, index) => {
            if (index === currentSuggestionIndex) {
                suggestion.classList.add('selected');
                suggestion.scrollIntoView({ block: 'nearest' });
            } else {
                suggestion.classList.remove('selected');
            }
        });
    } else if (e.key === 'Enter' && currentSuggestionIndex >= 0) {
        e.preventDefault();
        const input = characterInput.value.toLowerCase();
        const normalizedInput = normalizeForMatching(input);
        
        // Use the same sorting logic as in handleInput
        const allMatches = getFilteredCharacters()
            .filter(char => {
                const charName = char.Name.toLowerCase();
                const normalizedCharName = normalizeForMatching(char.Name);
                return charName.includes(input) || normalizedCharName.includes(normalizedInput);
            });
        
        const sortedMatches = allMatches.sort((a, b) => {
            const aName = a.Name.toLowerCase();
            const bName = b.Name.toLowerCase();
            const aNormalized = normalizeForMatching(a.Name);
            const bNormalized = normalizeForMatching(b.Name);
            
            // Exact match gets highest priority
            if (aName === input || aNormalized === normalizedInput) return -1;
            if (bName === input || bNormalized === normalizedInput) return 1;
            
            // Starts with input gets second priority
            if (aName.startsWith(input) || aNormalized.startsWith(normalizedInput)) return -1;
            if (bName.startsWith(input) || bNormalized.startsWith(normalizedInput)) return 1;
            
            // Then alphabetical order
            return aName.localeCompare(bName);
        });
        
        const selectedChar = sortedMatches.slice(0, 5)[currentSuggestionIndex];
        if (selectedChar) {
            selectSuggestion(selectedChar);
        }
    }
});

// Add function to handle suggestion selection
function selectSuggestion(character) {
    characterInput.value = character.Name;
    autoComplete.innerHTML = '';
    currentSuggestionIndex = -1;
    
    handleGuess(character);
    
    // Different behavior for mobile vs desktop
    if (window.innerWidth <= 600) {
        // Mobile: let browser handle keyboard naturally
        characterInput.blur();
    } else {
        // Desktop: maintain focus and clear input for next guess
        setTimeout(() => {
            characterInput.focus();
            characterInput.value = '';
        }, 50);
    }
}

// Check guess against target character
function checkGuess(guess) {
    const results = {};
    
    // Compare each property (excluding Hints and Image)
    Object.keys(guess).forEach(key => {
        if (key === 'Hints' || key === 'Image') {
            return; // Skip Hints and Image columns
        }
        if (key === 'Appearances') {
            // Check for overlap in appearances
            const intersection = guess[key].filter(x => targetCharacter[key].includes(x));
            results[key] = intersection.length > 0 ? 
                (intersection.length === guess[key].length && intersection.length === targetCharacter[key].length ? 'correct' : 'partial')
                : 'incorrect';
        } else if (key === 'Bending type') {
            // Convert to array if string
            const guessTypes = Array.isArray(guess[key]) ? guess[key] : [guess[key]];
            const targetTypes = Array.isArray(targetCharacter[key]) ? targetCharacter[key] : [targetCharacter[key]];
            
            if (guessTypes.length === targetTypes.length && 
                guessTypes.every(type => targetTypes.includes(type))) {
                results[key] = 'correct';
            } else if (guessTypes.some(type => targetTypes.includes(type))) {
                results[key] = 'partial';
            } else {
                results[key] = 'incorrect';
            }
        } else if (key === 'Affiliation/Group') {
            // Handle affiliations similar to appearances
            const intersection = guess[key].filter(x => targetCharacter[key].includes(x));
            results[key] = intersection.length > 0 ? 
                (intersection.length === guess[key].length && intersection.length === targetCharacter[key].length ? 'correct' : 'partial')
                : 'incorrect';
        } else if (key === 'Species') {
            // Handle species with partial matching
            const guessSpecies = Array.isArray(guess[key]) ? guess[key] : [guess[key]];
            const targetSpecies = Array.isArray(targetCharacter[key]) ? targetCharacter[key] : [targetCharacter[key]];
            
            if (guessSpecies.length === targetSpecies.length && 
                guessSpecies.every(species => targetSpecies.includes(species))) {
                results[key] = 'correct';
            } else if (guessSpecies.some(species => targetSpecies.includes(species))) {
                results[key] = 'partial';
            } else {
                results[key] = 'incorrect';
            }
        } else if (key === 'Special Skills') {
            // Handle special skills with partial matching
            const guessSkills = Array.isArray(guess[key]) ? guess[key] : [guess[key]];
            const targetSkills = Array.isArray(targetCharacter[key]) ? targetCharacter[key] : [targetCharacter[key]];
            
            if (guessSkills.length === targetSkills.length && 
                guessSkills.every(skill => targetSkills.includes(skill))) {
                results[key] = 'correct';
            } else if (guessSkills.some(skill => targetSkills.includes(skill))) {
                results[key] = 'partial';
            } else {
                results[key] = 'incorrect';
            }
        } else if (Array.isArray(guess[key])) {
            // Handle other array properties with partial matching
            const guessArray = Array.isArray(guess[key]) ? guess[key] : [guess[key]];
            const targetArray = Array.isArray(targetCharacter[key]) ? targetCharacter[key] : [targetCharacter[key]];
            
            if (guessArray.length === targetArray.length && 
                guessArray.every(item => targetArray.includes(item))) {
                results[key] = 'correct';
            } else if (guessArray.some(item => targetArray.includes(item))) {
                results[key] = 'partial';
            } else {
                results[key] = 'incorrect';
            }
        } else {
            // Handle simple properties
            results[key] = guess[key] === targetCharacter[key] ? 'correct' : 'incorrect';
        }
    });

    return results;
}

// Display guess results
function displayGuess(character, results) {
    // Create table wrapper and headers on first guess
    if (!document.querySelector('.column-headers')) {
        // Add game-active class to prevent layout jumping
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('game-active');
        }
        
        // Create a wrapper for both headers and rows
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-scroll-wrapper';
        
        // Create headers
        const headers = document.createElement('div');
        headers.className = 'column-headers';
        const headerNames = ['Name', 'Gender', 'Species', 'Origin', 'Bending', 'Sub-Skills', 'Affiliation', 'Appearances'];
        headerNames.forEach(name => {
            const header = document.createElement('div');
            header.className = 'column-header';
            header.textContent = name;
            header.addEventListener('click', () => showColumnInfo(name));
            headers.appendChild(header);
        });
        
        // Add headers to wrapper
        tableWrapper.appendChild(headers);
        
        // Move guess rows into wrapper
        guessRows.parentNode.removeChild(guessRows);
        tableWrapper.appendChild(guessRows);
        
        // Insert wrapper into game area
        gameArea.appendChild(tableWrapper);
        
        // Move scroll hint immediately after table wrapper
        const scrollHint = document.getElementById('scrollHint');
        if (scrollHint) {
            scrollHint.parentNode.removeChild(scrollHint);
            gameArea.insertBefore(scrollHint, tableWrapper.nextSibling);
        }
    }
    
    const row = document.createElement('div');
    row.className = 'guess-row';

    let colIndex = 0;
    Object.entries(results).forEach(([key, result], index) => {
        if (key !== 'Image' && key !== 'Hints') {  // Skip the Image and Hints columns
            const cell = document.createElement('div');
            cell.className = `guess-cell ${result}`;
            // For the leftmost cell (Name), add image above name, stacked vertically
            if (colIndex === 0) {
                cell.classList.add('guess-cell-with-image');
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'guess-cell-img-wrapper';
                const img = document.createElement('img');
                // Correct image path logic for characters folder
                let imgSrc = character.Image || '';
                if (imgSrc && !imgSrc.match(/^\/?assets\/images\/game1images\/characters\//)) {
                    imgSrc = 'assets/images/game1images/characters/' + imgSrc.replace(/^.*[\\\/]/, '');
                }
                
                // Check if there's no image source initially
                if (!imgSrc) {
                    cell.classList.add('no-image');
                    imgWrapper.style.display = 'none';
                } else {
                    img.src = imgSrc;
                    img.alt = character.Name;
                    img.className = 'guess-cell-img';
                    // Fallback for broken images
                    img.onerror = function() {
                        this.style.display = 'none';
                        imgWrapper.style.display = 'none';
                        cell.classList.add('no-image');
                    };
                    imgWrapper.appendChild(img);
                }
                cell.appendChild(imgWrapper);
                const nameDiv = document.createElement('div');
                nameDiv.className = 'guess-cell-name-label';
                nameDiv.textContent = character[key];
                cell.appendChild(nameDiv);
            } else {
                cell.textContent = Array.isArray(character[key]) ? 
                    character[key].join(', ') : character[key];
            }
            // Add delay for fade-in animation
            setTimeout(() => cell.style.opacity = 1, index * 100);
            row.appendChild(cell);
            colIndex++;
        }
    });

    // Show column headers on first guess
    const columnHeaders = document.querySelector('.column-headers');
    if (columnHeaders && columnHeaders.style.display === 'none') {
        columnHeaders.style.display = 'flex';
    }

    // Insert at the beginning of guessRows
    guessRows.insertBefore(row, guessRows.firstChild);
    row.classList.add('show');
    
    // Show column hint text and scroll hint on first guess
    if (guessRows.children.length === 1) {
        const columnHint = document.getElementById('columnHint');
        if (columnHint) {
            columnHint.style.display = 'block';
        }
        
        // Update scroll hint visibility based on actual scroll need
        updateScrollHintVisibility();
    }
}

// Handle guess submission
function handleGuess(character) {
    if (!gameActive) return;

    guessCount++;
    const results = checkGuess(character);
    displayGuess(character, results);
    characterInput.value = '';

    // Check if all properties are correct
    if (Object.values(results).every(result => result === 'correct')) {
        gameActive = false;
        gameComplete.style.display = 'block';
        gameComplete.style.marginBottom = '1rem';
        const guessText = guessCount === 1 ? 'guess' : 'guesses';
        successMessage.textContent = `Congratulations! You found ${targetCharacter.Name} in ${guessCount} ${guessText}!`;
        
        // Show character image
        const characterImage = document.getElementById('characterImage');
        let imgSrc = targetCharacter.Image || '';
        if (imgSrc && !imgSrc.match(/^\/?assets\/images\/game1images\/characters\//)) {
            imgSrc = 'assets/images/game1images/characters/' + imgSrc.replace(/^.*[\\\/]/, '');
        }
        if (imgSrc) {
            characterImage.src = imgSrc;
            characterImage.alt = targetCharacter.Name;
            characterImage.style.display = 'block';
        }
        
        gameArea.insertBefore(gameComplete, gameArea.firstChild);
        gameArea.classList.add('game-won');
        
        // Hide instructions, column hint, scroll hint, and hint display when game is won
        const instructions = document.querySelector('.game-instructions');
        if (instructions) instructions.style.display = 'none';
        
        const columnHint = document.getElementById('columnHint');
        if (columnHint) columnHint.style.display = 'none';
        
        const scrollHint = document.getElementById('scrollHint');
        if (scrollHint) scrollHint.style.display = 'none';
        
        const hintDisplay = document.getElementById('hintDisplay');
        if (hintDisplay) hintDisplay.style.display = 'none';
        
        // Settings button is now part of the game complete HTML
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function setupGameControls() {
    // Create game controls container if it doesn't exist
    // Set up button event listeners
    setupButtonListeners();
}

// Handle give up
function handleGiveUp() {
    if (!gameActive) return;
    gameActive = false;
    
    // Show column headers if not already visible
    const columnHeaders = document.querySelector('.column-headers');
    if (columnHeaders && columnHeaders.style.display === 'none') {
        columnHeaders.style.display = 'flex';
    }
    
    // Display the correct character as a guess row so player can see the answer
    const correctResults = checkGuess(targetCharacter);
    displayGuess(targetCharacter, correctResults);
    
    gameComplete.style.display = 'block';
    gameComplete.style.marginBottom = '1rem';
    successMessage.textContent = `The character was ${targetCharacter.Name}!`;
    
    // Show character image
    const characterImage = document.getElementById('characterImage');
    let imgSrc = targetCharacter.Image || '';
    if (imgSrc && !imgSrc.match(/^\/?assets\/images\/game1images\/characters\//)) {
        imgSrc = 'assets/images/game1images/characters/' + imgSrc.replace(/^.*[\\\/]/, '');
    }
    if (imgSrc) {
        characterImage.src = imgSrc;
        characterImage.alt = targetCharacter.Name;
        characterImage.style.display = 'block';
    }
    
    gameArea.classList.add('game-won');
    gameArea.insertBefore(gameComplete, gameArea.firstChild);
    
    // Hide instructions, column hint, scroll hint, and hint display when game ends
    const instructions = document.querySelector('.game-instructions');
    if (instructions) instructions.style.display = 'none';
    
    const columnHint = document.getElementById('columnHint');
    if (columnHint) columnHint.style.display = 'none';
    
    const scrollHint = document.getElementById('scrollHint');
    if (scrollHint) scrollHint.style.display = 'none';
    
    const hintDisplay = document.getElementById('hintDisplay');
    if (hintDisplay) hintDisplay.style.display = 'none';
    
    // Settings button is now part of the game complete HTML
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show hint functionality
function showHint() {
    if (!gameActive || !targetCharacter) return;
    
    const hintDisplay = document.getElementById('hintDisplay');
    const hintTitle = document.querySelector('.hint-title');
    const hintText = document.querySelector('.hint-text');
    
    // Check if target character has hints
    if (!targetCharacter.Hints || !Array.isArray(targetCharacter.Hints) || targetCharacter.Hints.length === 0) {
        return; // No hints available, do nothing
    }
    
    // Check if we've shown all available hints
    if (hintIndex >= targetCharacter.Hints.length) {
        return; // No more hints available
    }
    
    // Get the current hint
    const currentHint = targetCharacter.Hints[hintIndex];
    
    // Skip empty hints
    if (!currentHint || currentHint.trim() === '') {
        hintIndex++;
        showHint(); // Recursively try next hint
        return;
    }
    
    // Update hint display
    hintTitle.textContent = `Hint ${hintIndex + 1}:`;
    hintText.textContent = currentHint;
    hintDisplay.style.display = 'block';
    
    // Automatically focus the input box so player can continue typing
    const characterInput = document.getElementById('characterInput');
    if (characterInput) {
        setTimeout(() => {
            characterInput.focus();
        }, 100); // Small delay to ensure hint display is rendered first
    }
    
    // Increment hint index for next time
    hintIndex++;
}

// Reset hints when starting a new game
function resetHints() {
    hintIndex = 0;
    const hintDisplay = document.getElementById('hintDisplay');
    if (hintDisplay) {
        hintDisplay.style.display = 'none';
    }
}

// Handle checkbox interactions
function setupCheckboxListeners() {
    // Comics parent-child relationship
    const comicsCheckbox = document.getElementById('comics');
    const avatarComics = document.getElementById('avatar-comics');
    const korraComics = document.getElementById('korra-comics');

    comicsCheckbox.addEventListener('change', (e) => {
        avatarComics.checked = e.target.checked;
        korraComics.checked = e.target.checked;
    });

    [avatarComics, korraComics].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            comicsCheckbox.checked = avatarComics.checked || korraComics.checked;
        });
    });

    // Novels parent-child relationship
    const novelsCheckbox = document.getElementById('novels');
    const novelCheckboxes = [
        'kyoshi-novels',
        'yangchen-novels',
        'roku-novels',
        'avatar-novels'
    ].map(id => document.getElementById(id));

    novelsCheckbox.addEventListener('change', (e) => {
        novelCheckboxes.forEach(checkbox => checkbox.checked = e.target.checked);
    });

    novelCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            novelsCheckbox.checked = novelCheckboxes.some(cb => cb.checked);
        });
    });
}

// Initialize checkbox listeners
setupCheckboxListeners();

// Initialize game
loadCharacters();

async function initGame() {
  await loadCharacters();
  setupGameControls();
  setupCheckboxListeners();
  playButton.disabled = false;
}
initGame();

// Setup button listeners for the new control buttons
function setupButtonListeners() {
    const howToPlayButton = document.getElementById('howToPlayButton');
    const hintButton = document.getElementById('hintButton');
    const giveUpButton = document.getElementById('giveUpButton');
    const instructionsOverlay = document.getElementById('instructionsOverlay');
    const closeInstructions = document.getElementById('closeInstructions');

    // How to Play button - show overlay
    howToPlayButton.addEventListener('click', () => {
        instructionsOverlay.style.display = 'flex';
    });

    // Close instructions - hide overlay
    closeInstructions.addEventListener('click', () => {
        instructionsOverlay.style.display = 'none';
    });

    // Close overlay when clicking outside content
    instructionsOverlay.addEventListener('click', (e) => {
        if (e.target === instructionsOverlay) {
            instructionsOverlay.style.display = 'none';
        }
    });

    // Hint button functionality
    hintButton.addEventListener('click', showHint);

    // Give up button
    giveUpButton.addEventListener('click', handleGiveUp);
}

// Column info functionality
function getColumnValues(columnName) {
    const fieldMapping = {
        'Name': 'Name',
        'Gender': 'Gender', 
        'Species': 'Species',
        'Origin': 'Place of Origin',
        'Bending': 'Bending type',
        'Sub-Skills': 'Special Skills',
        'Affiliation': 'Affiliation/Group',
        'Appearances': 'Appearances'
    };
    
    const fieldName = fieldMapping[columnName];
    const valueCounts = {};
    
    // Use filtered characters based on current checkbox selections
    const filteredCharacters = getFilteredCharacters();
    
    // Count occurrences of each value in filtered set
    filteredCharacters.forEach(char => {
        const value = char[fieldName];
        if (Array.isArray(value)) {
            value.forEach(v => {
                valueCounts[v] = (valueCounts[v] || 0) + 1;
            });
        } else {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
    });
    
    // Convert to array of objects and sort
    if (columnName === 'Name') {
        // Alphabetical sorting for Name column
        return Object.keys(valueCounts).sort();
    } else {
        // Frequency-based sorting for all other columns (descending by count)
        return Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
    }
}

function showColumnInfo(columnName) {
    const overlay = document.getElementById('columnInfoOverlay');
    const title = document.getElementById('columnInfoTitle');
    const list = document.getElementById('columnInfoList');
    
    // Set title
    title.textContent = `Possible ${columnName}:`;
    
    // Clear existing list
    list.innerHTML = '';
    
    // Get values and populate list
    const values = getColumnValues(columnName);
    values.forEach(value => {
        const listItem = document.createElement('li');
        listItem.textContent = value;
        list.appendChild(listItem);
    });
    
    // Show overlay
    overlay.style.display = 'flex';
}

function hideColumnInfo() {
    const overlay = document.getElementById('columnInfoOverlay');
    overlay.style.display = 'none';
}

// Setup column info overlay event listeners
document.getElementById('closeColumnInfo').addEventListener('click', hideColumnInfo);
document.getElementById('columnInfoOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'columnInfoOverlay') {
        hideColumnInfo();
    }
});

// Event listeners
playButton.addEventListener('click', startGame);
replayButton.addEventListener('click', startGame);
characterInput.addEventListener('input', handleInput);
characterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && characterInput.value) {
        const character = getFilteredCharacters()
            .find(char => char.Name.toLowerCase() === characterInput.value.toLowerCase());
        if (character) {
            handleGuess(character);
            
            // Keep focus on desktop, only dismiss keyboard on mobile
            if (window.innerWidth > 600) {
                setTimeout(() => {
                    characterInput.focus();
                    characterInput.value = '';
                }, 50);
            }
        }
    }
});

// Global Enter key listener for play button activation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        // Don't trigger if the enter key was used in the character input field
        if (e.target === characterInput) {
            return;
        }
        
        // Check if we're on the game settings screen (play button visible)
        if (gameSettings.style.display !== 'none' && playButton.style.display !== 'none') {
            playButton.click();
        }
        // Check if we're on the game over screen (replay button visible)
        else if (gameComplete.style.display === 'block') {
            replayButton.click();
        }
    }
});

// Hide autocomplete when clicking outside of input or autocomplete
document.addEventListener('click', (e) => {
    if (!characterInput.contains(e.target) && !autoComplete.contains(e.target)) {
        autoComplete.innerHTML = '';
    }
});
