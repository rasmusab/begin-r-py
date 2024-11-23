<!-- quarto-live-customization.js -->
<script>
document.addEventListener("DOMContentLoaded", () => {
    const courseId = window.location.pathname; // Use the page's path as the scope
    const LOCAL_STORAGE_KEY = `revealedExercises-${courseId}`;
    const EDITED_TEXT_KEY = `editedExerciseText-${courseId}`;

    // Retrieve stored revealed exercises and edited text
    const revealedExercises = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
    const editedTexts = JSON.parse(localStorage.getItem(EDITED_TEXT_KEY)) || {};

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
                        if (node.nodeType === 1) {
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
    instructionDivs.forEach(div => {
        const exerciseValue = div.getAttribute("data-previous-exercise");
        if (revealedExercises.includes(exerciseValue)) {
            div.style.opacity = 1;
            div.style.pointerEvents = "auto";
            div.style.display = "block";
        } else {
            div.style.opacity = 0;
            div.style.pointerEvents = "none";
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
                        node.nodeType === 1 &&
                        node.classList.contains('alert') &&
                        node.classList.contains('exercise-grade') &&
                        node.classList.contains('alert-success')
                    ) {
                        const parentWithExercise = node.closest('div[data-exercise]');
                        if (parentWithExercise) {
                            const dataExerciseValue = parentWithExercise.getAttribute('data-exercise');
                            customActionOnExercise(dataExerciseValue);
                        }
                        const parentInstructionsAndExcercise = node.closest('div.instructions-and-exercise');
                        if (parentInstructionsAndExcercise) {
                            // pick out last-of-chapter attribute, if it exists
                            const lastOfChapter = parentInstructionsAndExcercise.getAttribute('data-last-of-chapter');
                            // if last-of-chapter is set then append it to a list in local storage called 
                            // finishedChapters
                            if (lastOfChapter) {
                                const finishedChapters = JSON.parse(localStorage.getItem('finishedChapters')) || [];
                                if (!finishedChapters.includes(lastOfChapter)) {
                                    finishedChapters.push(lastOfChapter);
                                    localStorage.setItem('finishedChapters', JSON.stringify(finishedChapters));
                                }
                                console.log(finishedChapters);
                            }
                        }
                    }
                });
            }
        }
    };

    const customActionOnExercise = (exerciseValue) => {
        const targetDiv = document.querySelector(
            `div.instructions-and-exercise[data-previous-exercise="${exerciseValue}"]`
        );

        if (targetDiv) {
            targetDiv.style.transition = 'opacity 0.5s';
            targetDiv.style.display = 'block';

            setTimeout(() => {
                targetDiv.style.opacity = 1;
                targetDiv.style.pointerEvents = 'auto';

                if (!revealedExercises.includes(exerciseValue)) {
                    revealedExercises.push(exerciseValue);
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(revealedExercises));
                }
            }, 1000);
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
