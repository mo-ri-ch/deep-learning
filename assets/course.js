// course.js — everything that belongs to this session only.
// The shared look and features come from study-notebook-design (loaded after this file).
// A session has ONE talk page (lessons/session.html) whose parts are the parts of the talk.

const COURSE_LESSONS = [
  { n: 1, step: "the session", title: "Deep Learning, Hands-on", file: "session.html", ready: true,
    summary: "Everything from the hands-on session.", leaves: null },
];

const NOTEBOOK = "https://colab.research.google.com/github/mo-ri-ch/deep-learning/blob/main/notebooks/deep_learning_hands_on.ipynb";
const NOTEBOOKS = { 1: NOTEBOOK };   // one notebook, in four parts

// Tap-to-explain words for this session's code (the shared list is in codewalk.js)
window.PYWORDS_EXTRA = {
  "torch": { what: "PyTorch: the library for building and training neural networks.", ex: "import torch\nprint(torch.tensor([1, 2]) * 2)", out: "tensor([2, 4])" },
  "tensor": { what: "Makes a tensor: a list (or grid) of numbers that PyTorch can do maths on, and track gradients for.", ex: "import torch\nprint(torch.tensor([1.0, 2.0]).sum())", out: "tensor(3.)" },
  "requires_grad": { what: "Tells PyTorch to work out this number's gradient when you call backward().", ex: "import torch\nw = torch.tensor(2.0, requires_grad=True)\n(w * w).backward()\nprint(w.grad)", out: "tensor(4.)" },
  "mean": { what: "The average of all the numbers.", ex: "import torch\nprint(torch.tensor([1.0, 2.0, 6.0]).mean())", out: "tensor(3.)" },
  "backward": { what: "Works out the gradient of the loss for every number that has requires_grad=True, and stores it in .grad.", ex: "import torch\nw = torch.tensor(3.0, requires_grad=True)\n(2 * w).backward()\nprint(w.grad)", out: "tensor(2.)" },
  "grad": { what: "The gradient that backward() worked out: which way, and how steeply, the loss goes up.", ex: "import torch\nw = torch.tensor(1.0, requires_grad=True)\n(5 * w).backward()\nprint(w.grad)", out: "tensor(5.)" },
  "gradio": { what: "A library that turns a Python function into a small web app.", ex: "import gradio as gr\nprint(gr.__name__)", out: "gradio" },
  "gr": { what: "The short name we gave gradio when importing it.", ex: "import gradio as gr\nprint(gr.__name__)", out: "gradio" },
  "Interface": { what: "Builds the web app: your function, what goes in (an image), and what comes out (labels with scores).", ex: "gr.Interface(fn, gr.Image(), gr.Label())", out: "(an app, shown by .launch())" },
  "launch": { what: "Starts the app. With share=True it also gives a public link.", ex: "app.launch(share=True)", out: "Running on public URL: https://….gradio.live" },
  "zip": { what: "Walks through two lists side by side, in pairs.", ex: "for a, b in zip([\"x\", \"y\"], [1, 2]):\n    print(a, b)", out: "x 1\ny 2" },
  "model_scores": { what: "A small helper in the notebook: runs your trained network on one photo and returns a chance for each gesture.", ex: "model_scores(photo)", out: "[0.03, 0.94, 0.03]   (paper, rock, scissors)" },
  "np": { what: "NumPy, the usual Python library for lists of numbers. We imported it as np.", ex: "import numpy as np\nprint(np.argmax([0.1, 0.7, 0.2]))", out: "1" },
  "argmax": { what: "The position of the biggest number: which gesture got the highest chance.", ex: "import numpy as np\nprint(np.argmax([0.1, 0.7, 0.2]))", out: "1" },
  "GESTURES": { what: "The three answers, in order: paper, rock, scissors.", ex: "print(GESTURES[1])", out: "rock" },
  "BEATS": { what: "Which move beats which: rock → paper, paper → scissors, scissors → rock.", ex: "print(BEATS[\"rock\"])", out: "paper" },
  "Image": { what: "Gradio's photo input. sources=[\"webcam\", \"upload\"] lets you take a photo or pick a file.", ex: "gr.Image(sources=[\"webcam\", \"upload\"])", out: "(a photo box in the app)" },
  "Textbox": { what: "Gradio's text output: where the app writes its answer.", ex: "gr.Textbox()", out: "(a text box in the app)" },
};

window.COURSE = {
  id: "deep-learning",
  pathLabel: "The session",
  lessons: COURSE_LESSONS,
  support: false,                  // no support note inside a session
  colab: NOTEBOOK,
  notebooks: NOTEBOOKS,
  setup: [],

  // Read by webinar.js on the home page
  webinar: {
    parts: [
      { title: "Deep learning today", sum: "What's new, and the plan.", href: "lessons/session.html#1" },
      { title: "How a network learns", sum: "A neuron, the loss and walking downhill. Notebook Part 1.", href: "lessons/session.html#3" },
      { title: "Networks and images", sum: "Layers, the training loop, overfitting and convolution. Rock, paper, scissors in Part 2.", href: "lessons/session.html#8" },
      { title: "Borrow a trained network", sum: "Transfer learning and foundation models.", href: "lessons/session.html#13" },
      { title: "The leaderboard", sum: "Teams fine-tune with just 60 photos, live on the board. Part 3.", href: "lessons/session.html#16" },
      { title: "Play against it", sum: "An app that reads your hand from the webcam. Part 4.", href: "lessons/session.html#17" },
    ],
  },
};
