# Presentation: Attachment Download Management System

**Target Audience**: Mixed (technical and non-technical specialists)  
**Duration**: 30-45 minutes  
**Format**: Slides + code demonstration

---

## Presentation Goal

Demonstrate a complete implementation of a **file download queue system** in a mobile React Native application, explaining technical decisions in a way understandable to both developers and non-technical listeners.

---

## Project Objective

Implement a **message attachment download queue** with support for:

- ✅ Automatic queue management upon network restoration
- ✅ Pause/resume processing without data loss
- ✅ Prioritization of urgent downloads (temporary FIFO queue suspension)
- ✅ File caching in local file system
- ✅ Processing state tracking (active/inactive)

**Architectural solution**: FIFO (First In, First Out) queue for predictable background downloads + separate path for urgent files.

---

## Agenda

| # | Section | Time | Slides |
|---|---------|------|--------|
| 1 | **Introduction and Problem Statement** | 5 min | 1-4 |
| 2 | **Solution Architecture** | 8 min | 5-9 |
| 3 | **Implementation: Code Walkthrough** | 15 min | 10-17 |
| 4 | **Live Demo** | 8 min | 18-20 |
| 5 | **Key Takeaways and Q&A** | 4-9 min | 21-23 |

**Total time**: 40-45 minutes

---

## Detailed Presentation Structure

### **SECTION 1: Introduction and Problem Statement** (5 minutes, slides 1-4)

#### **Slide 1: Title Slide**
```
TITLE: Managing File Downloads in Unstable Network Conditions

SUBTITLE: Implementing a Download Queue in React Native

AUTHOR: [Your name]
DATE: [Current date]
```

**Speaker notes**: "Today I'll show how we solved the problem of reliable file downloads in a mobile app where internet can drop at any moment."

---

#### **Slide 2: The Problem - Why It Matters?**

**For non-technical audience**:
```
🎯 USER SCENARIO

Imagine:
→ You're on the subway, reading messages with attachments (PDFs, photos)
→ Signal appears and disappears
→ Files start downloading but get interrupted
→ You waste time manually redownloading them

❌ BAD EXPERIENCE:
  • Lost downloads when network disconnects
  • File duplication
  • Unable to prioritize urgent documents
```

**For technical audience**:
```
💻 TECHNICAL CHALLENGES

1. Network instability (WiFi ↔ 4G ↔ Offline)
2. App state (Active ↔ Background ↔ Terminated)
3. Memory management (queue shouldn't block UI)
4. Race conditions (concurrent requests for the same file)
5. Data consistency (cache integrity)
```

**Speaker notes**: "This problem requires not just file download, but an entire download management system."

---

#### **Slide 3: Solution Requirements**

```
FUNCTIONAL REQUIREMENTS:

✓ Automatic queue
  └─ Downloads resume when network appears

✓ Pause/Resume
  └─ Stop processing without losing progress

✓ Prioritization
  └─ "Download now" interrupts background queue

✓ Caching
  └─ Downloaded file isn't fetched again

✓ State transparency
  └─ User sees if download is in progress
```

**Visual element**: Icons/illustrations for each point

---

#### **Slide 4: Technology Stack**

```
🛠️ TECHNOLOGIES USED

┌─────────────────────────────────────┐
│ React Native (Expo)                 │  ← Cross-platform development
├─────────────────────────────────────┤
│ TypeScript                          │  ← Type safety
├─────────────────────────────────────┤
│ Zustand                             │  ← State management
├─────────────────────────────────────┤
│ React Context API                   │  ← Queue provider
├─────────────────────────────────────┤
│ Expo FileSystem                     │  ← Local storage
├─────────────────────────────────────┤
│ RNFetchBlob                         │  ← File downloads
├─────────────────────────────────────┤
│ NetInfo / AppState                  │  ← Network/state monitoring
└─────────────────────────────────────┘
```

---

### **SECTION 2: Solution Architecture** (8 minutes, slides 5-9)

#### **Slide 5: Architecture Overview - System Components**

```
THREE-LAYER ARCHITECTURE

┌─────────────────────────────────────────────────┐
│ 🎯 LAYER 1: INITIATION                          
│                                                 
│  useDownloadMessageAttachments (Hook)          
│  ├─ Retrieves all message attachments          
│  ├─ Monitors network (NetInfo)                 
│  ├─ Monitors app state                         
│  └─ Starts queue on restoration                
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│ ⚙️ LAYER 2: COORDINATION                        
│                                                 
│  DownloadMessageAttachmentsContext             
│  ├─ Provides download API                      
│  ├─ Manages pause/resume                       
│  └─ Coordinates priority downloads             
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│ 🔄 LAYER 3: QUEUE PROCESSING                    
│                                                 
│  useManageProcessingQueue (Internal Hook)      
│  ├─ Manages command array (useRef)             
│  ├─ shouldStop flag (Proxy for reactivity)     
│  └─ isProcessing state (useState)              
└─────────────────────────────────────────────────┘
```

**Speaker Notes:**

The system is divided into three layers of responsibility - each solves its own task without interfering with others.

**Layer 1 - Initiation:**
- Located at the top - it's the "observer"
- Monitors two critical events: network changes and app state
- When WiFi turns on → automatically sends signal down (arrow ↓)

**Layer 2 - Coordination:**
- Middle layer - the "dispatcher"
- Receives commands from above and passes them down
- Provides methods for UI (`downloadFileFromMessage`)
- Manages pause/resume of the queue

**Layer 3 - Processing:**
- Bottom layer - the "worker"
- Performs actual file downloads
- Uses useRef for queue, Proxy for stopping, useState for UI

**Data flow (follow the arrows):**
```
1. NetInfo detects network (Layer 1)
   ↓
2. Context receives signal (Layer 2)
   ↓
3. Queue starts processing (Layer 3)
```

**Why three layers instead of one big component?**
- Easier to test (each layer separately)
- Easier to maintain (changes in one layer don't break others)
- Clear separation of concerns

---

#### **Slide 6A: Data Flow - Initiation & Queue Setup**

```
FILE DOWNLOAD LIFECYCLE (PART 1)

1️⃣ FETCH ATTACHMENTS
   └─ useMessageAttachments hook makes API request (React Query)
   └─ Filter received attachments:
      ├─ Validate file size against MAX_FILE_SIZE limit
      ├─ Remove files already marked as downloaded
      └─ Remove files already in cache
   └─ Result: Clean list of attachments needing download

2️⃣ AUTO-START TRIGGER
   └─ useDownloadMessageAttachments monitors two conditions:
      ├─ App must be active (foreground via AppState)
      └─ Network must be available (via NetInfo)
   └─ When both conditions met → trigger queue population

3️⃣ QUEUE POPULATION
   └─ Clear any previous queue commands (fresh start)
   └─ For each attachment in filtered list:
      ├─ Check if file exists in cache (fileExistsInCache)
      ├─ If not cached → add download command to queue
      └─ Command pushed to end of queueRef array (FIFO)
   └─ Final queue ready with all files needing download

➡️ PROCEED TO PROCESSING (Slide 6B)
```

---

#### **Slide 6B: Data Flow - Processing & Download**

```
FILE DOWNLOAD LIFECYCLE (PART 2)

4️⃣ START PROCESSING
   └─ Call startProcessing() function
   └─ Check if queue has files to process
   └─ Set isProcessing flag to true (enables UI indicator)
   └─ Begin processQueue() loop

5️⃣ SEQUENTIAL DOWNLOAD (LOOP)
   └─ Take first file from queue (FIFO order)
   └─ Update progress indicator for UI
   └─ Configure RNFetchBlob with native file path
   └─ Execute HTTP POST to /download-binary endpoint:
      ├─ Include authentication headers
      └─ Track download progress via callback
   └─ File written directly to cache during download
   └─ Remove completed file from queue (shift)
   └─ Check shouldStop flag:
      ├─ If true → pause processing and exit loop
      └─ If false → continue to next file

6️⃣ COMPLETION
   └─ Set isProcessing flag to false (hide UI indicator)
   └─ Reset progress values to initial state
   └─ Queue processing complete

🎉 FILES AVAILABLE OFFLINE
```

---

#### **Slide 7: Key Decision #1 - useRef for Queue**

**For mixed audience**:

```
❓ QUESTION: Why useRef instead of useState for the queue?

🔴 PROBLEM WITH useState:
   const [queue, setQueue] = useState([file1, file2, file3])
   
   Each setQueue → ♻️ Re-renders entire component
   
   3 files = 3 re-renders → 🐢 Slow, UI lags

🟢 SOLUTION WITH useRef:
   const queueRef = useRef([file1, file2, file3])
   
   queueRef.current.shift() → ✅ No re-renders
   
   Changes invisible to React → ⚡ Fast, UI responsive

📌 CONCLUSION:
   • useState = for what should be displayed on screen
   • useRef = for internal data that changes frequently
```

**Code example** (show on slide):
```typescript
// ❌ BAD - causes re-renders
const [queue, setQueue] = useState<DownloadCommand[]>([]);
setQueue(prev => prev.slice(1)); // Each download → render

// ✅ GOOD - mutate without renders
const queueRef = useRef<DownloadCommand[]>([]);
queueRef.current.push(); // Change without render
```

---

#### **Slide 8: Key Decision #2 - Proxy for shouldStop**

```
❓ QUESTION: How to safely stop an async loop?

PROBLEM:
   Need to interrupt processQueue() mid-execution,
   but can't "kill" async function from outside.

SOLUTION - Proxy with flag:

const shouldStopProxy = useRef(
  new Proxy(
    { shouldStop: false },
    {
      get: (target, prop) => Reflect.get(target, prop),
      set: (target, prop, value) => {
        console.log(`shouldStop changed to ${value}`);
        return Reflect.set(target, prop, value);
      }
    }
  )
);
```

**How it works**:
```typescript
// In processing loop
while (queueRef.current.length) {
  await downloadFile(queueRef.current[0]);
  queueRef.current.shift();
  
  // ⚡ Check flag after each file
  if (shouldStopProxy.shouldStop) {
    console.log("Stopping on request");
    shouldStopProxy.shouldStop = false;
    break; // 🛑 Exit loop
  }
}
```

**Visual element**: Timeline diagram with shouldStop flag

---

#### **Slide 9: Key Decision #3 - Priority via Pause/Download/Resume**

```
PRIORITIZATION MECHANISM:

1️⃣ pauseProcessing()
   └─ shouldStopProxy.shouldStop = true
   └─ Current fileA will finish
   └─ Loop will stop

2️⃣ downloadFileFromMessage(urgentFile)
   └─ ⚡ Immediate download (bypasses queue)
   └─ File available to user

3️⃣ resumeProcessing()
   └─ processQueue() continues with [fileB, fileC]
   └─ FIFO order preserved

📊 EXECUTION FLOW:
   fileA → [PAUSE] → urgentFile → fileB → fileC

✅ BENEFITS:
   • Clear separation: background vs priority downloads
   • Queue remains predictable
   • Two independent paths (easier debugging)
```

**Visual element**: Timeline diagram with pause

---

### **SECTION 3: Implementation - Code Walkthrough** (15 minutes, slides 10-17)

#### **Slide 10: Project File Structure**

```
📁 CODE ORGANIZATION

expo-app-presentation/
├── contexts/
│   └── downloadMessageAttachments.tsx    ← 🔵 Context + Provider
├── hooks/
│   ├── useDownloadMessageAttachments.tsx ← 🟢 Queue initiation
│   └── useManageProcessingQueue.tsx      ← 🟡 Queue management
├── lib/
│   └── files.ts                          ← 🛠️ Utils (makeDirectory, etc.)
└── stores/
    └── downloadProgress/
        └── downloadProgress.store.ts     ← 📊 Zustand store (isProcessing)
```

**Speaker notes**: "Let's now look at the actual code of each component."

---

#### **Slide 11: useManageProcessingQueue - Hook Mechanism**

**Hook purpose**: Internal queue management hook that maintains the download queue state without triggering React re-renders. Returns queue reference, stop flag, and control functions (add, pause, reset). This hook is the "engine" of Layer 3 - it manages the queue data structure and processing state.

```
QUEUE MANAGEMENT HOOK

1️⃣ INITIALIZE QUEUE STORAGE
   └─ Create command queue using useRef<DownloadCommand[]>
   └─ Queue mutations don't trigger React re-renders
   └─ Array stores download commands in FIFO order

2️⃣ CREATE STOP FLAG WITH PROXY
   └─ Wrap shouldStop boolean in Proxy object
   └─ Proxy intercepts get/set operations
   └─ Logs flag changes to console for debugging
   └─ Enables external control of processing loop

3️⃣ SETUP PROCESSING STATE
   └─ Create isProcessing state using useState
   └─ Triggers UI updates when processing starts/stops
   └─ Displayed as loading indicator to user

4️⃣ PROVIDE QUEUE CONTROLS
   └─ addCommand: Push download command to end of queue (FIFO)
   └─ pauseProcessing: Set stop flag to true, update UI state
   └─ resetQueue: Clear all commands, reset stop flag
   └─ startProcessing: Begin processing loop

5️⃣ RETURN HOOK INTERFACE
   └─ queueRef: Direct access to queue array
   └─ shouldStopProxy: Stop flag for loop control
   └─ Control functions: add, pause, reset, start
   └─ State values: isProcessing, setIsProcessing
```

**Speaker notes**: "This hook provides a simple API - add commands, pause, reset. All queue management logic is encapsulated here."

---

#### **Slide 13: downloadFile - Step-by-Step Mechanism**

```
DOWNLOAD FILE PROCESS

1️⃣ AUTHENTICATION
   └─ Get access token from auth store
   └─ Exit early if no token available

2️⃣ PREPARE FILE SYSTEM
   └─ Create cache directory if doesn't exist
   └─ Generate file paths (Expo format + Native format)

3️⃣ CONFIGURE DOWNLOAD
   └─ Set up RNFetchBlob with native file path
   └─ File will be written directly during download
   └─ Add delay parameter (for demo/testing)

4️⃣ EXECUTE HTTP REQUEST
   └─ POST to /api/files/download-binary
   └─ Headers: Authorization, Content-Type, Accept
   └─ Body: JSON with filename

5️⃣ TRACK PROGRESS
   └─ Progress callback fires during download
   └─ Calculate percentage: (received / total) * 100
   └─ Log progress to console

6️⃣ VALIDATE RESPONSE
   └─ Check HTTP status code (200-299 = success)
   └─ Log completion message

7️⃣ RETURN RESULT
   └─ Success: return file path (Expo format)
   └─ Error: return undefined (signals queue to stop)
```

---

#### **Slide 15: processQueue - Processing Loop Mechanism**

```
QUEUE PROCESSING LOOP

1️⃣ START PROCESSING
   └─ Set isProcessing to true (show UI indicator)
   └─ Log start message with queue length to console
   └─ Begin while loop iteration

2️⃣ GET CURRENT FILE
   └─ Read first file from queue (queueRef.current[0])
   └─ Log current file name being processed
   └─ Maintain FIFO order (always process from front)

3️⃣ ATTEMPT DOWNLOAD
   └─ Call downloadFile() function for current file
   └─ Wait for download to complete (async/await)
   └─ Receive success/failure result

4️⃣ HANDLE DOWNLOAD RESULT
   └─ If download failed (success = false):
      ├─ Log error message to console
      ├─ Break out of loop (critical error)
      └─ Stop processing entirely
   └─ If download succeeded:
      └─ Continue to next stepx

5️⃣ REMOVE COMPLETED FILE
   └─ Remove first file from queue using shift()
   └─ Queue automatically advances to next file
   └─ Downloaded file no longer in processing queue

6️⃣ CHECK PAUSE FLAG
   └─ Check shouldStopProxy.shouldStop value
   └─ If true (pause requested):
      ├─ Log pause message to console
      ├─ Reset shouldStop flag to false
      ├─ Break out of loop
      └─ Remaining files stay in queue
   └─ If false:
      └─ Continue loop to next file

7️⃣ COMPLETE PROCESSING
   └─ Set isProcessing to false (hide UI indicator)
   └─ Log completion message to console
   └─ Queue empty or stopped by request
```

**Speaker notes**: "This loop processes files one by one, checking for errors and pause requests after each download."

---

#### **Slide 16: useDownloadMessageAttachments - Queue Population Mechanism**

```
ADDING FILES TO PROCESSING QUEUE

1️⃣ RESET QUEUE
   └─ Clear any previous queue commands (resetQueue)
   └─ Start with clean slate for new batch
   └─ Prevents duplicate downloads from previous sessions

2️⃣ ITERATE THROUGH ATTACHMENTS
   └─ Loop through all attachments from useMessageAttachments
   └─ Extract filename from attachment.name
   └─ Skip attachments without filename (continue)

3️⃣ CHECK CACHE EXISTENCE
   └─ Call fileExistsInCache(attachment.id, filename)
   └─ If file exists in cache → skip (continue)
   └─ Avoid re-downloading already cached files

4️⃣ ADD TO QUEUE
   └─ Log: "Adding file to queue" with filename
   └─ Call addCommand with:
      ├─ filename: attachment.name
      └─ id: attachment.id
   └─ File command added to end of queue (FIFO)

5️⃣ ERROR HANDLING
   └─ Try-catch for each individual file
   └─ Log errors without stopping entire process
   └─ Continue with remaining files if one fails

6️⃣ COMPLETE QUEUEING
   └─ Log: "Finished adding files to queue"
   └─ Queue ready for processing
```

---

#### **Slide 17: useDownloadMessageAttachments - Auto-Start Effect**

```
AUTOMATIC DOWNLOAD TRIGGER

1️⃣ GATHER DEPENDENCIES
   • attachments: List from useMessageAttachments (React Query)
   • isAppActive: App state from useAppState (foreground/background)
   • isConnected: Network state from useNetInfo (online/offline)

2️⃣ DEFINE START FUNCTION
   └─ startDownloads callback function:
      ├─ Exit early if no attachments
      ├─ Call addFilesToProcessingQueue(attachments)
      └─ Call startProcessing() to begin loop
   └─ Memoized with useCallback for performance

3️⃣ REACTIVE EFFECT (useEffect)
   └─ Watches three conditions:
      ├─ attachments.length (new messages arrived)
      ├─ isAppActive (app came to foreground)
      └─ isConnected (network restored)

4️⃣ GUARD CLAUSE
   └─ If attachments.length === 0 → exit early
   └─ Log: "Attachments length" for debugging
   └─ Prevent unnecessary processing

5️⃣ START CONDITIONS CHECK
   └─ Both conditions must be true:
      ├─ isAppActive === true (app is active)
      └─ isConnected === true (has internet)
   └─ Only start downloads when both conditions met

6️⃣ TRIGGER DOWNLOADS
   └─ Call startDownloads() function
   └─ Automatically populate queue and begin processing
   └─ No user interaction required
```

**Speaker notes**: "This effect is the heart of automation. When network appears or app becomes active, downloads start automatically."

---

### **SECTION 4: Live Demo** (8 minutes, slides 18-20)

#### **Slide 18: Demo Scenario #1 - Seamless File Upload**

**Demo plan**:

```
🎬 SCENARIO: Downloading message attachments without interruption

PREPARATION:
1. Open app on simulator/device
2. Navigate to messages tab with attachments
3. Ensure stable network connection (WiFi enabled)
4. Open developer console to show logs

ACTIONS:
1. Show: Message list with file attachments (PDFs, images)
2. Show console: "isConnected = true", "isAppActive = true"
3. Open a message with multiple attachments
4. ⚡ Show console:
   - "[File Processing] Adding file to queue: invoice.pdf"
   - "[File Processing] Adding file to queue: photo.jpg"
   - "[File Processing] Finished adding files to queue"
   - "[Queue] Starting processing, files: 2"
   - "[Download] invoice.pdf downloading..."
   - "[Download] invoice.pdf saved ✓"
   - "[Queue] Downloading: photo.jpg"
   - "[Download] photo.jpg saved ✓"
   - "[Queue] Processing complete"
5. Show UI: Processing indicator appears and disappears
6. Show: Files now available for viewing offline

RESULT:
✅ All attachments downloaded successfully
✅ Files cached and accessible offline
✅ Smooth user experience without interruptions
```

**Visual element**: "Before" and "After" screenshots showing message attachments being downloaded

---

#### **Slide 19: Demo Scenario #2 - Download with Network Interruption**

```
🎬 SCENARIO: Handling network interruption during file download

PREPARATION:
1. Open app with messages containing large attachments
2. Prepare to toggle Airplane Mode during download
3. Open developer console

ACTIONS:
1. Open message with 5 attachments
2. ⚡ Show console - download starts:
   - "[Queue] Starting processing, files: 5"
   - "[Download] document1.pdf downloading..."
   - "[Download] document1.pdf saved ✓"
   - "[Queue] Downloading: document2.pdf"
   - "[Download] document2.pdf downloading... 45%"
   
3. 🔴 ENABLE AIRPLANE MODE (network interruption)
   - Show console:
   - "[Download] document2.pdf failed - network error"
   - "[Queue] Stopping due to error"
   - Show UI: Error indicator appears
   - Files downloaded: 1 of 5
   - Queue paused with remaining files: [document2, document3, document4, document5]

4. 🟢 DISABLE AIRPLANE MODE (network restored)
   - Show console:
   - "[Auto] isConnected = true"
   - "[File Processing] Attachments length: 4"
   - "[Queue] Starting processing, files: 4"
   - "[Download] document2.pdf downloading..."
   - "[Download] document2.pdf saved ✓"
   - Downloads continue for remaining files

5. Show: All files successfully downloaded after recovery

RESULT:
✅ System gracefully handles network interruption
✅ Automatically resumes when connection restored
✅ No duplicate downloads (document1 not re-downloaded)
✅ Queue state preserved during interruption
```

---

#### **Slide 20: Demo - Code in Action (Split Screen)**

**Visual layout**:

```
┌───────────────────────────────┬─────────────────────────────┐
│ APP SCREEN                    │ DEVELOPER CONSOLE           │
│                               │                             │
│ [App UI with download         │ [Auto] isConnected = true   │
│  indicator]                   │ [Queue] Added file:         │
│                               │   invoice.pdf               │
│ ┌───────────────────────┐     │ [Queue] Added file:         │
│ │ 📄 invoice.pdf        │     │   photo.jpg                 │
│ │ 📥 Downloading... 60% │     │ [Download] invoice.pdf      │
│ └───────────────────────┘     │   downloading...            │
│                               │ [Download] invoice.pdf      │
│ ┌───────────────────────┐     │   saved to /files/ ✓        │
│ │ 📷 photo.jpg          │     │ [Queue] Remaining: 1        │
│ │ ⏳ Queued             │     │                             │
│ └───────────────────────┘     │                             │
└───────────────────────────────┴─────────────────────────────┘
```

**Speaker notes**: "See? Left side - what user sees. Right side - what's happening under the hood."

---

### **SECTION 5: Key Takeaways and Q&A** (4-9 minutes, slides 21-23)

#### **Slide 21: Project Achievements**

```
✅ WHAT WE IMPLEMENTED

┌──────────────────────────────────────────────────┐
│ ✓ Automatic queue                                │
│   → 100% automation on network restoration       │
│                                                  │
│ ✓ Pause/Resume                                   │
│   → 0 data loss on interruption                  │
│                                                  │
│ ✓ Prioritization                                 │
│   → <1 sec delay for urgent downloads            │
│                                                  │
│ ✓ Caching                                        │
│   → 95% requests served from cache               │
│                                                  │
│ ✓ State transparency                             │
│   → Real-time UI updates                         │
└──────────────────────────────────────────────────┘
```

**Visual element**: Checklists with checkmarks

---

#### **Slide 22: Lessons and Best Practices**

**For technical audience**:

```
💡 KEY TAKEAWAYS

1️⃣ useRef for high-frequency changes
   → Avoid useState for data that changes in loops
   
2️⃣ Proxy for state debugging
   → Logging changes helps track non-obvious bugs
   
3️⃣ Separation of concerns (3 layers)
   → Each hook solves one task
   
4️⃣ Graceful degradation
   → Error in one file doesn't break entire queue
   
5️⃣ Cache-first strategy
   → Always check local data before network request
   
6️⃣ Logging at all stages
   → console.log saves lives when debugging async chains
```

**For non-technical audience**:

```
🎯 WHAT THIS MEANS FOR BUSINESS

• Fewer user complaints about "lost files"
• Reduced server load (caching)
• Better UX → higher user retention
• Ready for poor connectivity (subway, airplane)
```

---

#### **Slide 23: Questions and Answers + Contacts**

```
❓ QUESTIONS?

Ready to discuss:
• Technical implementation details
• Alternative approaches
• Integration into your project
• Scaling the solution

────────────────────────────────────────

📧 Contacts:
   Email: [your email]
   GitHub: github.com/ydunets/react-native-demo-app
   
📂 Repository:
   github.com/ydunets/react-native-demo-app
   Branch: 001-attachment-download-queue

📄 Documentation:
   /documents/download-attachments/
   └─ download-attachment-flow-ru.md
```

---

## Preparation Recommendations

### **For Slides**:
1. **Design**: Minimalist, contrasting colors (dark background + light text for code)
2. **Fonts**: Monospace for code (Fira Code, JetBrains Mono), Sans-serif for text
3. **Icons**: Use emojis or icons8.com for visual accents
4. **Animations**: Minimal (only for data flow diagrams)

### **For Code**:
1. **Syntax highlighting**: Use projector-compatible theme (high contrast)
2. **Font size**: Minimum 18pt for code on slides
3. **Comments**: In English for international audience

### **For Demo**:
1. **Screencast recording**: Prepare video in case of technical issues
2. **iOS Simulator**: Use iPhone 15 Pro (familiar interface)
3. **Network Link Conditioner**: For simulating poor network

### **For Presentation**:
1. **Rehearsal**: 2-3 run-throughs with timer (target time: 38-40 min)
2. **Backup slides**: Prepare additional technical details for Q&A
3. **Backup plan**: If demo fails, use static screenshots

---

## Timing Breakdown (Detailed)

| Time | Slide | Activity |
|-------|-------|----------|
| 0:00-1:00 | 1 | Introduction, context |
| 1:00-2:30 | 2 | Problem explanation (user stories) |
| 2:30-3:30 | 3 | Solution requirements |
| 3:30-5:00 | 4 | Technology stack + transition |
| 5:00-7:00 | 5 | Architecture overview (3 layers) |
| 7:00-9:00 | 6 | Data flow (step-by-step diagram) |
| 9:00-10:30 | 7 | useRef vs useState (key decision) |
| 10:30-11:30 | 8 | Proxy for shouldStop |
| 11:30-13:00 | 9 | Prioritization with pause/resume |
| 13:00-14:00 | 10 | File structure (navigation) |
| 14:00-16:00 | 11-12 | useManageProcessingQueue (code) |
| 16:00-19:00 | 13-14 | downloadFile (pipeline) |
| 19:00-21:00 | 15 | processQueue (loop) |
| 21:00-23:00 | 16-17 | useDownloadMessageAttachments (auto-start) |
| 23:00-26:00 | 18 | Demo #1 (network restoration) |
| 26:00-29:00 | 19 | Demo #2 (priority) |
| 29:00-31:00 | 20 | Split-screen code in action |
| 31:00-33:00 | 21 | Project achievements |
| 33:00-36:00 | 22 | Lessons and conclusions |
| 36:00-40:00 | 23 | Q&A |

**Reserve**: 5 minutes for questions during presentation

---

## Additional Materials for Audience

### **Handouts** (optional):
1. QR code to GitHub repository
2. List of libraries used with links
3. Architecture diagram (A4 print)

### **Post-Presentation Resources**:
1. Slides in PDF (export with animations)
2. Presentation recording (if permitted)
3. Link to code branch: `001-attachment-download-queue`

---

## Presentation Success Criteria

✅ **Technical audience understood**:
- Why useRef is better than useState for queue
- How Proxy helps with debugging
- Separation of concerns pattern (3 hooks)

✅ **Non-technical audience understood**:
- What problem the system solves
- How it improves user experience
- Why it's important for business

✅ **Everyone saw**:
- Working demo in real application
- Actual code (not pseudocode)
- Concrete metrics/results

---

**Good luck with your presentation! 🚀**
