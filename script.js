let startTime = null;
let reactionTime = null;
let deviceInfo = {};
let testStarted = false;

const API_ENDPOINT = 'https://your-api-endpoint.com/api/test-results';
const USE_LOCAL_STORAGE = true;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

function initialize() {
    captureDeviceInfo();
    initializeWelcomeModal();
}

function initializeWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    const startBtn = document.getElementById('startBtn');

    startBtn.addEventListener('click', () => {

        welcomeModal.classList.remove('show');
        
        setTimeout(() => {
            initializeTest();
        }, 300);
    });
}

function initializeTest() {
    if (testStarted) return;
    testStarted = true;

    const iframe = document.getElementById('modelFrame');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const modelVisibleBtn = document.getElementById('modelVisibleBtn');
    const mainContainer = document.getElementById('mainContainer');

    mainContainer.style.display = 'block';
    document.body.classList.add('iframe-active');

    const iframeSrc = iframe.getAttribute('data-src');
    if (iframeSrc && !iframe.src) {
        iframe.src = iframeSrc;
    }

    startTime = performance.now();

    setTimeout(() => {
        modelVisibleBtn.disabled = false;
    }, 500);

    iframe.addEventListener('load', () => {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 300);
    }, { once: true });

    setTimeout(() => {
        if (!loadingOverlay.classList.contains('hidden')) {
            loadingOverlay.classList.add('hidden');
        }
    }, 10000);

    modelVisibleBtn.addEventListener('click', () => {
        if (startTime) {
            reactionTime = Math.round(performance.now() - startTime);
            showSurvey();
        }
    });

    const surveyButtons = document.querySelectorAll('.survey-btn');
    surveyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const perceivedSpeed = e.target.dataset.value;
            handleSurveyResponse(perceivedSpeed);
        });
    });
}

function captureDeviceInfo() {
    deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: screen.width,
        screenHeight: screen.height,
        devicePixelRatio: window.devicePixelRatio,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        language: navigator.language,
        timestamp: new Date().toISOString()
    };

    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('win') > -1) {
        deviceInfo.os = 'Windows';
    } else if (ua.indexOf('mac') > -1) {
        deviceInfo.os = 'macOS';
    } else if (ua.indexOf('linux') > -1) {
        deviceInfo.os = 'Linux';
    } else if (ua.indexOf('android') > -1) {
        deviceInfo.os = 'Android';
    } else if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) {
        deviceInfo.os = 'iOS';
    } else {
        deviceInfo.os = 'Unknown';
    }
}

function showSurvey() {
    const surveyModal = document.getElementById('surveyModal');
    surveyModal.classList.add('show');

    document.getElementById('modelVisibleBtn').disabled = true;
}

function handleSurveyResponse(perceivedSpeed) {
    const testResults = {
        reactionTime: reactionTime,
        perceivedSpeed: perceivedSpeed,
        deviceInfo: deviceInfo,
        testUrl: 'https://lls634.github.io/Stop-Glow-Gallery/',
        timestamp: new Date().toISOString()
    };

    console.log('=== TEST RESULTS ===');
    console.log(JSON.stringify(testResults, null, 2));
    console.log('===================');

    sendToServer(testResults);

    showCompletionMessage();
}

function showCompletionMessage() {
    const surveyModal = document.getElementById('surveyModal');
    const modalContent = surveyModal.querySelector('.modal-content');
    
    const surveyOptions = modalContent.querySelector('.survey-options');
    const surveyQuestion = modalContent.querySelector('.survey-question');
    const modalTitle = modalContent.querySelector('h2');
    
    if (surveyOptions) surveyOptions.style.display = 'none';
    if (surveyQuestion) surveyQuestion.style.display = 'none';
    if (modalTitle) modalTitle.style.display = 'none';
    
    const completionMsg = modalContent.querySelector('.completion-message');
    if (completionMsg) {
        completionMsg.style.display = 'block';
    }
}

function sendToServer(data) {
    if (API_ENDPOINT && API_ENDPOINT !== 'https://your-api-endpoint.com/api/test-results') {
        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                console.log('✓ Results successfully sent to server');
                return response.json();
            } else {
                throw new Error('Server responded with error');
            }
        })
        .then(result => {
            console.log('Server response:', result);
        })
        .catch(error => {
            console.error('Failed to send to server:', error);
            if (USE_LOCAL_STORAGE) {
                saveToLocalStorage(data);
            }
        });
    } else if (USE_LOCAL_STORAGE) {
        saveToLocalStorage(data);
    }
}

function saveToLocalStorage(data) {
    try {
        const existingResults = JSON.parse(localStorage.getItem('testResults') || '[]');

        existingResults.push(data);

        localStorage.setItem('testResults', JSON.stringify(existingResults));
        
        console.log('✓ Results saved to localStorage');
        console.log(`Total results stored: ${existingResults.length}`);
        
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function exportResults() {
    try {
        const results = JSON.parse(localStorage.getItem('testResults') || '[]');
        const jsonString = JSON.stringify(results, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Results exported successfully');
    } catch (error) {
        console.error('Failed to export results:', error);
    }
}

window.exportTestResults = exportResults;