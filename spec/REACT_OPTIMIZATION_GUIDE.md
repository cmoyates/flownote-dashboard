# Guiding Principles for Optimizing React Re-Renders

The primary goal is to prevent unnecessary re-renders. A re-render is only necessary when a component's appearance or behavior needs to change. The most effective and maintainable optimizations involve restructuring components, not just applying memoization.

## 1. Prioritize Component Composition

Before reaching for `React.memo` or `useMemo`, always analyze if the component structure can be improved. Compositional optimizations are more robust and align better with React's design principles.

### Technique 1: Move State Down

If a piece of state is only used by a small part of a component's subtree, extract that part into a new component and move the state into it.

**Example:**

**Before Optimization:**

```javascript
function App() {
  const [color, setColor] = useState("red");

  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
      <ExpensiveTree />
    </div>
  );
}
```

In this case, `ExpensiveTree` re-renders every time the `color` state changes, even though it doesn't use it.

**After Optimization:**

```javascript
function App() {
  return (
    <>
      <ColorPickerForm />
      <ExpensiveTree />
    </>
  );
}

function ColorPickerForm() {
  const [color, setColor] = useState("red");

  return (
    <>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
    </>
  );
}
```

Now, when the `color` state changes, only the `ColorPickerForm` component re-renders, and `ExpensiveTree` is unaffected.

### Technique 2: Lift Content Up (Pass Components as `children`)

If a component that holds state (`Parent`) renders another component (`Child`) that is expensive to re-render, you can pass the expensive component to the parent as the `children` prop. This is a powerful technique because if you pass React the same element you gave it on the last render, it won't bother re-rendering that element.

When the parent's state updates, it will re-render, but the `children` prop it receives is the _exact same reference_ as before. Therefore, React knows it can skip re-rendering the children.

**Example:**

**Before Optimization:**

```javascript
function App() {
  const [color, setColor] = useState("red");

  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p>Hello, world!</p>
      <ExpensiveTree />
    </div>
  );
}
```

**After Optimization:**

```javascript
function App() {
  return (
    <ColorPicker>
      <p>Hello, world!</p>
      <ExpensiveTree />
    </ColorPicker>
  );
}

function ColorPicker({ children }) {
  const [color, setColor] = useState("red");

  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      {children}
    </div>
  );
}
```

Now, when `ColorPicker` re-renders due to a `color` change, it receives the same `children` prop, and `ExpensiveTree` will not re-render.

## 2. Use Memoization as a Last Resort

Memoization (`React.memo`, `useMemo`, `useCallback`) should only be used after profiling your application with React DevTools and identifying specific performance bottlenecks that cannot be solved by composition.

Memoization is fragile and can be easily broken, leading to what is described as an "uphill battle."

### When to Use `React.memo`

Wrap a component in `React.memo` to prevent it from re-rendering if its props have not changed.

#### Key Considerations

- **Referential Stability is Crucial:** `React.memo` performs a shallow comparison of props. If you pass non-primitive values (objects, arrays, functions) that are created new on each render, the memoization will be ineffective.
- **Broken by Inline Props:** Passing an inline object or function as a prop will break memoization, as a new reference is created on every render.

  ```javascript
  // This will break memoization on ExpensiveTree
  <ExpensiveTree style={{ backgroundColor: "blue" }} />
  ```

- **Broken by `children` Prop:** Passing JSX as `children` to a memoized component will also break memoization because JSX creates a new object on every render.

### When to Use `useCallback` and `useMemo`

The primary reason to use `useCallback` and `useMemo` is to maintain referential stability for props passed to a memoized component or for dependencies in hooks like `useEffect`.

#### Key Considerations and Anti-Patterns

- **The Useless `useCallback`:** Do not wrap functions in `useCallback` if they are being passed to a non-memoized component (like a built-in `<button>`) or a component that doesn't rely on referential stability. It adds overhead for no benefit.

  ```javascript
  // Useless useCallback, as <button> is not a memoized component.
  function MyButton() {
    const onClick = useCallback(() => {
      /* ... */
    }, []);
    return <button onClick={onClick} />;
  }
  ```

- **The Fragile Dependency Chain:** Using a prop as a dependency for an internal `useCallback` is an anti-pattern because you cannot control the stability of the incoming prop. This often leads to long, fragile chains of memoization that are easily broken and hard to reason about.

## 3. Advanced Strategy: External State Management

When component composition is not enough, especially in cases with large, shared state, consider moving that state outside of React into a dedicated state manager (e.g., Zustand, Jotai).

This approach stores state outside the component tree and allows components to subscribe _only_ to the specific pieces of state they need. This surgically triggers re-renders only on the components that have subscribed to the changed state, effectively avoiding top-down re-renders without the fragility of manual memoization.

## 4. Future Considerations for React 19

- **React Forget:** The React team is developing a compiler, "React Forget," that aims to automatically memoize components and hooks, which may eliminate the need for manual memoization in many cases.
- **`useEffectEvent`:** A new hook, `useEffectEvent`, is being developed to allow access to the latest value of props or state within an effect without adding it as a dependency. This will solve many use cases where `useCallback` is currently used to prevent effects from re-firing too often.
