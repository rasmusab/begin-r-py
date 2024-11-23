<!-- quarto-live-customization.js -->
<script>
document.addEventListener("DOMContentLoaded", () => {
    const chapterId = window.location.pathname; // Use the page's path as the scope
    const LOCAL_STORAGE_KEY = `completedExercises-${chapterId}`;
    const EDITED_TEXT_KEY = `editedExerciseText-${chapterId}`;
    const FINISHED_CHAPTERS_KEY = `finishedChapters`;

    // Retrieve stored revealed exercises and edited text
    const completedExercises = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
    const editedTexts = JSON.parse(localStorage.getItem(EDITED_TEXT_KEY)) || {};
    const finishedChapters = JSON.parse(localStorage.getItem(FINISHED_CHAPTERS_KEY)) || [];

    // Restore text for all cm-content divs
    const restoreEditedTexts = (cmContent) => {
        const exerciseId = cmContent.closest('.cell').getAttribute('data-exercise');
        if (editedTexts[exerciseId]) {
            cmContent.textContent = editedTexts[exerciseId];
        }
    };

    // Save text to local storage on edit
    const trackEdits = (cmContent) => {
        console.log("Adding trackEdits to");
        console.log(cmContent);
    
        // Create a MutationObserver to monitor changes inside cmContent
        const observer = new MutationObserver(() => {
            console.log("Detected changes in cmContent");
    
            // Find the parent cell with data-exercise
            const exerciseId = cmContent.closest('.cell').getAttribute('data-exercise');
            if (exerciseId) {
                // Extract and save the current text content (ignoring any nested tags)
                const editedText = cmContent.textContent.trim();
                editedTexts[exerciseId] = editedText;
    
                // Save to local storage
                localStorage.setItem(EDITED_TEXT_KEY, JSON.stringify(editedTexts));
                console.log(`Saved edited text for ${exerciseId}:`, editedText);
            }
        });
    
        // Configure the observer
        observer.observe(cmContent, {
            childList: true, // Monitor additions/removals of child nodes
            subtree: true,   // Monitor changes within all descendants
            characterData: true // Track changes to text nodes
        });
    };

    // Use a MutationObserver to watch for dynamically added cm-content divs
    const observeDynamicCmContent = () => {
        const targetNode = document.body;
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // console.log(node);
                        if (node.tagName === 'DIV') {
                            // Check if the added node is a cm-content div or contains cm-content divs
                            const cmContents = node.querySelectorAll('.cm-content');
                            console.log(cmContents);
                            cmContents.forEach(cmContent => {
                                console.log("Saw cmContent");
                                restoreEditedTexts(cmContent); // Restore text if saved
                                trackEdits(cmContent); // Add event listener for edits
                            });
                        }
                    });
                }
            }
        });

        observer.observe(targetNode, { childList: true, subtree: true });
    };

    observeDynamicCmContent(); // Start observing for dynamic content

    // Set all divs with class instructions-and-exercise to opacity = 0 and unclickable
    const instructionDivs = document.querySelectorAll('div.instructions-and-exercise');
    // Hiding all but the first instructions-and-exercise div
    Array.from(instructionDivs).slice(1).forEach(div => {
        const exerciseValue = div.getAttribute("data-exercise");
        const previousExerciseValue = exerciseValue.replace(/(\d+)$/, (_, num) => {
            return String(Number(num) - 1);
        });
        if (completedExercises.includes(previousExerciseValue)) {
            div.style.opacity = 1;
            div.style.pointerEvents = "auto";
            div.style.display = "block";
        } else {
            div.style.opacity = 0;
            div.style.pointerEvents = "none";
            div.style.display = "none";
        }
    });

    // Define the resetExercises function
    const resetExercises = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(EDITED_TEXT_KEY);
        location.reload(); // Refresh the page
    };

    // Example: Add resetExercises function to a button
    const resetButton = document.querySelector("#reset-exercise-button");
    if (resetButton) {
        resetButton.addEventListener("click", resetExercises);
    }

    // MutationObserver logic for exercises (as before)
    const targetNode = document.body;
    const callback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (
                        node.tagName === 'DIV' &&
                        node.classList.contains('exercise-grade') &&
                        node.classList.contains('alert-success')
                    ) {
                        const parentWithExercise = node.closest('div[data-exercise]');
                        if (parentWithExercise) {
                            const exerciseValue = parentWithExercise.getAttribute('data-exercise');
                            if (!completedExercises.includes(exerciseValue)) {
                              completedExercises.push(exerciseValue);
                              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completedExercises));
                            }
                            // If exerciseValue is, say, ex4, then the next exercise is ex5
                            // Extract this using a regexp
                            const nextExercise = exerciseValue.replace(/(\d+)$/, (_, num) => {
                              return String(Number(num) + 1);
                            });
                            
                            const targetDiv = document.querySelector(
                              `div.instructions-and-exercise[data-exercise="${nextExercise}"]`
                            );
                            
                            if (targetDiv) {
                              targetDiv.style.transition = 'opacity 0.5s';
                              targetDiv.style.display = 'block';
                  
                              setTimeout(() => {
                                  targetDiv.style.opacity = 1;
                                  targetDiv.style.pointerEvents = 'auto';
                              }, 1000);
                            } else { // Assume we've completed the last exercise of the chapter
                              if (!finishedChapters.includes(chapterId)) {
                                finishedChapters.push(chapterId);
                                localStorage.setItem('finishedChapters', JSON.stringify(finishedChapters));
                              }
                            }
                        }
                    }
                });
            }
        }
    };

    const observer = new MutationObserver(callback);
    const config = {
        childList: true,
        subtree: true
    };
    observer.observe(targetNode, config);
});

</script>
