import React, { useState, useRef, useEffect } from "react"
import { Editor } from "slate-react"
import { initialValue } from "./slateInitialValue"
import { Operation, Value } from "slate"
import io from "socket.io-client"

const socket = io("http://localhost:4001")

interface Props {
  groupId: string
}

export const SyncingEditor: React.FC<Props> = ({ groupId }) => {
  const [value, setValue] = useState(initialValue)
  const id = useRef(`${Date.now()}`)
  const editor = useRef<Editor | null>(null)
  const remote = useRef(false)

  useEffect(() => {
    fetch(`http://localhost:4001/groups/${groupId}`).then(x =>
      x.json().then(data => {
        setValue(Value.fromJSON(data))
      })
    )

    const eventName = `new-remote-operations-${groupId}`
    socket.on(
      eventName,
      ({ editorId, ops }: { editorId: string; ops: Operation[] }) => {
        if (id.current !== editorId) {
          remote.current = true
          ops.forEach((op: Operation) => editor.current!.applyOperation(op))
          remote.current = false
        }
      }
    )

    return () => {
      socket.off(eventName)
    }
  }, [groupId, id])

  return (
    <>
      <button
        onMouseDown={e => {
          e.preventDefault()
          //bold selected text
          editor.current!.toggleMark("bold")
        }}
      >
        BOLD
      </button>
      <button
        onMouseDown={e => {
          e.preventDefault()
          //bold selected text
          editor.current!.toggleMark("italic")
        }}
      >
        ITALIC
      </button>
      <Editor
        ref={editor}
        style={{
          backgroundColor: "#fafafa",
          maxWidth: 800,
          minHeight: 150
        }}
        value={value}
        renderMark={(props, _editor, next) => {
          if (props.mark.type === "bold") {
            return <strong>{props.children}</strong>
          } else if (props.mark.type === "italic") {
            return <em>{props.children}</em>
          }

          return next()
        }}
        onChange={opts => {
          setValue(opts.value)

          const ops = opts.operations
            .filter(o => {
              if (o) {
                return (
                  o.type !== "set_selection" &&
                  o.type !== "set_value" &&
                  (!o.data || !o.data.has("source"))
                )
              }
              return false
            })
            .toJS()
            .map((o: any) => ({ ...o, data: { source: "two" } }))

          if (ops.length && !remote.current) {
            socket.emit("new-operations", {
              editorId: id.current,
              ops: ops,
              value: opts.value.toJSON(),
              groupId
            })
          }
        }}
      />
    </>
  )
}
