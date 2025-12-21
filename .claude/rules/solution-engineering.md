# Solution Engineering

<avoid_over_engineering>
Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused.

- Do not add features, refactor code, or make "improvements" beyond what was asked. A bug fix does not need surrounding code cleaned up. A simple feature does not need extra configurability.
- Do not add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Do not use backwards-compatibility shims when you can just change the code.
- Do not create helpers, utilities, or abstractions for one-time operations. Do not design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task. Reuse existing abstractions where possible and follow the DRY principle.
</avoid_over_engineering>

<investigate_before_answering>
Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer - give grounded and hallucination-free answers.
</investigate_before_answering>

## File Hygiene

If you create any temporary new files, scripts, or helper files for iteration, clean up these files by removing them at the end of the task. Leave only the final code in the main files.
