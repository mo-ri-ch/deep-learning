// course.js — everything that belongs to this session only.
// The shared look and features come from study-notebook-design (loaded after this file).
// A session has ONE talk page (lessons/session.html) whose parts are the parts of the talk.

const COURSE_LESSONS = [
  { n: 1, step: "the session", title: "Deep Learning, Hands-on", file: "session.html", ready: true,
    summary: "Everything from the hands-on session.", leaves: null },
];

const NB = n => `https://colab.research.google.com/github/mo-ri-ch/deep-learning/blob/main/notebooks/${n}`;
const NOTEBOOKS = {
  1: NB("1_pytorch_basics.ipynb"),
  2: NB("2_first_network.ipynb"),
  3: NB("3_images_and_apps.ipynb"),
};

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
  "model_scores": { what: "A small helper in the notebook: runs the trained model on one picture and returns a chance for each kind of object.", ex: "model_scores(photo)", out: "[0.91, 0.02, …]   (10 chances)" },
};

window.COURSE = {
  id: "deep-learning",
  pathLabel: "The session",
  lessons: COURSE_LESSONS,
  support: false,                  // no support note inside a session
  colab: NOTEBOOKS[1],
  notebooks: NOTEBOOKS,
  setup: [],

  // Read by webinar.js on the home page
  webinar: {
    parts: [
      { title: "Deep learning today", sum: "What's new, and today's plan.", href: "lessons/session.html#1" },
      { title: "How a network learns", sum: "A neuron, the loss and walking downhill. Notebook 1.", href: "lessons/session.html#3" },
      { title: "Your first network", sum: "Layers, the training loop and overfitting. Notebook 2.", href: "lessons/session.html#8" },
      { title: "Seeing images", sum: "Convolution and transfer learning. Notebook 3.", href: "lessons/session.html#13" },
      { title: "Foundation models", sum: "Models that already know a lot, with no training.", href: "lessons/session.html#16" },
      { title: "Build and share", sum: "A mini challenge, and your model as a web app.", href: "lessons/session.html#18" },
    ],
  },
};
