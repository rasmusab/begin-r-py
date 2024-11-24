<!-- quarto-live-customization.js -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const chapterPath = window.location.pathname;
  const completedExercisesKey = `completedExercises-${chapterPath}`;
  const editedAnswersKey = `editedExerciseText-${chapterPath}`;
  const completedChaptersKey = 'completedChapters';

  const completedExercises = JSON.parse(localStorage.getItem(completedExercisesKey)) || [];
  const editedAnswers = JSON.parse(localStorage.getItem(editedAnswersKey)) || {};
  const completedChapters = JSON.parse(localStorage.getItem(completedChaptersKey)) || [];
  
  
  // activeChapterLinkText will be the name of the chapter as set in _quarto.yml
  // and as diplayed in the sidebar. This will be used as the ID for the chapter.
  let activeChapterLinkText = null;
  const activeLink = document.querySelector('a.sidebar-item-text.sidebar-link.active');
  if (activeLink) {
    const menuTextSpan = activeLink.querySelector('span.menu-text');
    if (menuTextSpan) {
      activeChapterLinkText = menuTextSpan.textContent.trim();
    }
  }
  
  function markCompletedChapters() {
    const sidebarItems = document.querySelectorAll('a.sidebar-item-text.sidebar-link');
    sidebarItems.forEach((item) => {
      const menuTextSpan = item.querySelector('span.menu-text');
      if (menuTextSpan) {
        const chapterLinkText = menuTextSpan.textContent.trim();
        if (completedChapters.includes(chapterLinkText)) {
          menuTextSpan.textContent = `✅ ${chapterLinkText}`;
        }
      }
    });
  }

  function monitorEdits(cmContent) {
    const observer = new MutationObserver(() => {
      const exerciseId = cmContent.closest('.cell').getAttribute('data-exercise');
      if (exerciseId) {
        const editedText = cmContent.innerText;
        editedAnswers[exerciseId] = editedText;
        localStorage.setItem(editedAnswersKey, JSON.stringify(editedAnswers));
      }
    });

    observer.observe(cmContent, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function restoreAndMonitorAnswer(cmContent) {
    // Restore edited text, if any.
    const exerciseId = cmContent.closest('.cell').getAttribute('data-exercise');
    if (editedAnswers[exerciseId]) {
      cmContent.innerText = editedAnswers[exerciseId];
    }
    
    // Monitor the code edit area for changes and save them to local storage.
    const observer = new MutationObserver(() => {
      const exerciseId = cmContent.closest('.cell').getAttribute('data-exercise');
      if (exerciseId) {
        const editedAnswer = cmContent.innerText;
        editedAnswers[exerciseId] = editedAnswer;
        localStorage.setItem(editedAnswersKey, JSON.stringify(editedAnswers));
      }
    });

    observer.observe(cmContent, {childList: true, subtree: true, characterData: true});
  }
  
  // As the answers are dynamically loaded, we need to observe the DOM for changes.
  // The reason the class name is cm-content, is because the code editor uses CodeMirror.
  function observeDynamicAnswers() {
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'DIV') {
              if (node.classList.contains('cm-content')) {
                restoreAndMonitorAnswer(node);
              } else {
                node.querySelectorAll('.cm-content').forEach(restoreAndMonitorAnswer);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function adjacentExerciseId(exerciseId, offset) {
    return exerciseId.replace(/(\d+)$/, (_, num) => String(Number(num) + offset));
  }

  function isPreviousExerciseCompleted(exerciseId) {
    const previousExerciseId = adjacentExerciseId(exerciseId, -1);
    return completedExercises.includes(previousExerciseId);
  }
  
  function toggleDivVisibility(div, isVisible) {
    div.style.opacity = isVisible ? 1 : 0;
    div.style.pointerEvents = isVisible ? 'auto' : 'none';
    div.style.display = isVisible ? 'block' : 'none';
  }
  
  
  function initializeInstructionDivs() {
    const instructionDivs = document.querySelectorAll('div.instructions-and-exercise');
    Array.from(instructionDivs)
      .slice(1) // skip the first exercise
      .forEach((div) => {
        const exerciseId = div.getAttribute('data-exercise');
        const isVisible = isPreviousExerciseCompleted(exerciseId);
        toggleDivVisibility(div, isVisible);
      });
      
    const completedChapterInstructionsDiv = document.querySelector(`div.completed-chapter-instructions`);
      
    if (! completedChapters.includes(activeChapterLinkText)) {
      toggleDivVisibility(completedChapterInstructionsDiv, false);
    }
  }
  
  function rainConfetti() {
    let confettiCanvas = document.getElementById('confetti');
    if (!confettiCanvas) {
      confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'confetti';
      confettiCanvas.style.position = 'fixed';
      confettiCanvas.style.top = '0';
      confettiCanvas.style.left = '0';
      confettiCanvas.style.width = '100%';
      confettiCanvas.style.height = '100%';
      confettiCanvas.style.pointerEvents = 'none';
      confettiCanvas.style.zIndex = '9999';
      document.body.appendChild(confettiCanvas);
    }
    const confettiCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const confettiParticles = Array.from({ length: 150 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 6 + 2,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      speed: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2,
    }));
    
    drawConfettiFrame(confettiCtx, confettiCanvas, confettiParticles);
  }
  
  function drawConfettiFrame(confettiCtx, confettiCanvas, confettiParticles) {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach(p => {
      confettiCtx.fillStyle = p.color;
      confettiCtx.beginPath();
      confettiCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      confettiCtx.fill();
      p.y += p.speed;
      p.x += Math.cos(p.angle) * 2;
    });
    
    confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height);
    if (confettiParticles.length > 0) {
      requestAnimationFrame(() => drawConfettiFrame(confettiCtx, confettiCanvas, confettiParticles));
    }
  }
  
  
  function revealHiddenDiv(div) {
    div.style.transition = 'opacity 0.5s';
    div.style.display = 'block';
    setTimeout(() => {
      div.style.opacity = 1;
      div.style.pointerEvents = 'auto';
    }, 1000);
  }
  
  function handleExerciseCompletion(exerciseId) {
    if (!completedExercises.includes(exerciseId)) {
      completedExercises.push(exerciseId);
      localStorage.setItem(completedExercisesKey, JSON.stringify(completedExercises));
    }

    const nextExerciseId = adjacentExerciseId(exerciseId, 1);
    const nextInstructionDiv = document.querySelector(`div.instructions-and-exercise[data-exercise="${nextExerciseId}"]`);

    if (nextInstructionDiv) {
      revealHiddenDiv(nextInstructionDiv)
    } else if (activeChapterLinkText && !completedChapters.includes(activeChapterLinkText)) {
      // No more exercises! Let's assume we've completed the chapter.
      completedChapters.push(activeChapterLinkText);
      localStorage.setItem(completedChaptersKey, JSON.stringify(completedChapters));
      const completedChapterInstructionsDiv = document.querySelector(`div.completed-chapter-instructions`);
      revealHiddenDiv(completedChapterInstructionsDiv);
      markCompletedChapters();
      rainConfetti();
    }
  }
  
  // As "exercise success" divs are also dynamically, again, we need to observe the DOM for changes.
  function observeExerciseCompletion() {
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (
              node.tagName === 'DIV' &&
              node.classList.contains('exercise-grade') &&
              node.classList.contains('alert-success')
            ) {
              const parentExerciseDiv = node.closest('div[data-exercise]');
              if (parentExerciseDiv) {
                const exerciseId = parentExerciseDiv.getAttribute('data-exercise');
                handleExerciseCompletion(exerciseId);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  function resetChapter() {
    localStorage.removeItem(completedExercisesKey);
    localStorage.removeItem(editedAnswersKey);
    if(activeChapterLinkText) {
      localStorage.setItem(completedChaptersKey, 
        JSON.stringify(completedChapters.filter((chapter) => chapter !== activeChapterLinkText))
      );        
    }
    location.reload();
  }
  

  function initializeResetButton() {
    const resetButton = document.querySelector('#reset-exercise-button');
    if (resetButton) {
      resetButton.addEventListener('click', resetChapter);
    }
  }

  markCompletedChapters() 
  observeDynamicAnswers();
  observeExerciseCompletion();
  initializeInstructionDivs();
  initializeResetButton();
});
</script>
