import { createRef, Component } from 'preact';
import { useState, useCallback, useRef, useEffect } from '/lib/hooks/index.jsx'; 
import { useStore } from '/lib/state';


class CKEditor extends Component {
  constructor( props ) {
    super( props );

    // After mounting the editor, the variable will contain a reference to the created editor.
    // @see: https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editor-Editor.html
    this.editor = null;
    this.domContainer = createRef();
  }

  // This component should never be updated by React itself.
  shouldComponentUpdate( nextProps ) {
    if ( !this.editor ) {
      return false;
    }

    if ( this._shouldUpdateContent( nextProps ) ) {
      this.editor.setData( nextProps.data || '' );
    }

    if ( 'disabled' in nextProps ) {
      this.editor.isReadOnly = nextProps.disabled;
    }

    return false;
  }

  // Initialize the editor when the component is mounted.
  componentDidMount() {
    this._initializeEditor();
  }

  // Destroy the editor before unmouting the component.
  componentWillUnmount() {
    this._destroyEditor();
  }

  // Render a <div> element which will be replaced by CKEditor.
  render() {
    // We need to inject initial data to the container where the editable will be enabled. Using `editor.setData()`
    // is a bad practice because it initializes the data after every new connection (in case of collaboration usage).
    // It leads to reset the entire content. See: #68
    return <article data-gramm="false" name={this.props.name} class={`article`} ref={ this.domContainer }></article>
  }

  _initializeEditor() {
    this.props.editor
      .create( this.domContainer.current , this.props.config )
      .then( editor => {
        (this.domContainer.current.closest('.content, section')).appendChild( editor.ui.view.body._bodyCollectionContainer );
        return editor;
      } )
      .then( editor => {
        this.editor = editor;
        this.editor.setData(this.props.data || '');

        if ( 'disabled' in this.props ) {
          editor.isReadOnly = this.props.disabled;
        }

        if ( this.props.onInit ) {
          this.props.onInit( editor );
        }

        const modelDocument = editor.model.document;
        const viewDocument = editor.editing.view.document;

        modelDocument.on( 'change:data', event => {
          if ( this.props.onChange ) {
            this.props.onChange( event, editor );
          }
        } );

        viewDocument.on( 'focus', event => {
          if ( this.props.onFocus ) {
            this.props.onFocus( event, editor );
          }
        } );

        viewDocument.on( 'blur', event => {
          if ( this.props.onBlur ) {
            this.props.onBlur( event, editor );
          }
        } );
      } )
      .catch( error => {
        console.error( error );
      } );
  }

  _destroyEditor() {
    if ( this.editor ) {
      this.editor.destroy()
        .then( () => {
          this.editor = null;
        } );
    }
  }

  _shouldUpdateContent( nextProps ) {
    // Check whether `nextProps.data` is equal to `this.props.data` is required if somebody defined the `#data`
    // property as a static string and updated a state of component when the editor's content has been changed.
    // If we avoid checking those properties, the editor's content will back to the initial value because
    // the state has been changed and React will call this method.
    if ( this.props.data === nextProps.data ) {
      return false;
    }

    // We should not change data if the editor's content is equal to the `#data` property.
    if ( this.editor.getData() === nextProps.data ) {
      return false;
    }

    return true;
  }
}

export default function({name, value, placeholder}) {
  const [loaded, setLoaded] = useState(typeof BalloonEditor != 'undefined')
  const [currentValue, setValue] = useState(value)
  const inputRef = useRef();

  const user = useStore('auth.user');



  const onExternalChange = useCallback((e) => {
    setValue(e.target.value)
  }, []);

  if (!loaded) {
    if (!document.head.querySelector('#ckeditor')) {
      const script = document.createElement("script");
      console.log('%c editor %c %O', 'background: #BDBDBD; color: #333; border-radius: 2px;', '', 'load')
      script.onload = () => {
        console.log('%c editor %c %O', 'background: #BDBDBD; color: #333; border-radius: 2px;', '', 'loaded')
      }
      script.id = 'ckeditor'
      script.async = true;
      script.src = new URL('../../assets/ckeditor.js', import.meta.url).href;
      document.head.appendChild(script)
    }
    document.head.querySelector('#ckeditor').addEventListener('load',() => setLoaded(true))
    var content = <p class="loader">Loading editor...</p>;
  } else {

    const config = {
      placeholder: placeholder,


      mediaEmbed: {
        previewsInData: true,
        extraProviders: [
          {
            name: 'youtube2',
            url: [
              /^(?:m\.)?youtube\.com\/watch\?v=([\w-]+)([a-zA-Z0-9:&?=%]*)?/,
              /^(?:m\.)?youtube\.com\/v\/([\w-]+)([a-zA-Z0-9:&?=%]*)?/,
              /^youtube\.com\/embed\/([\w-]+)([a-zA-Z0-9:&?=%]*)?/,
              /^youtu\.be\/([\w-]+)([a-zA-Z0-9:&?=%]*)?/
            ],
            html: match => {
              const id = match[ 1 ];
              const extras = match[2] || ''
              const start = extras.match(/start=([^&]+)/)
              const end = extras.match(/end=([^&]+)/)
              var params = '';
              if (start)
                params += (params ? '&' : '?') + start[0]
              if (end)
                params += (params ? '&' : '?') +  end[0]
              return (
                '<div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;">' +
                  `<iframe src="https://www.youtube.com/embed/${ id }${ params }" ` +
                    'style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" ' +
                    'frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>' +
                  '</iframe>' +
                '</div>'
              );
            }
          },
          {
            name: 'embedly',
            url: [/.*/],

          }
        ],
        removeProviders: ['youtube']
      },

      simpleUpload: {
          // The URL that the images are uploaded to.
          uploadUrl: `${import.meta.env.API_URL}/lessons/images?api_key=${user.apiKey}`,

          
          // Headers sent along with the XMLHttpRequ st to the upload server.
          headers: {
          //    'X-CSRF-TOKEN': 'CSFR-Token',
          //    Authorization: 'Bearer <JSON Web Token>'
          }
      },
      
      heading: {
          options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h2', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h3', title: 'Heading 2', class: 'ck-heading_heading2' }
          ]
      },

      image: {
        upload: {

          types: [ 'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'svg+xml'],

        }
      }
      //extraPlugins: [SimpleUploadAdapter],
    }//{  }

    var content = <CKEditor
      config={config}
      editor={ BalloonEditor }
      data={currentValue}
      name={name}
      onInit={ editor => {
        this.loaded = true;

        editor.keystrokes.set( 'Ctrl+D', 'insertCard'); 
        
        editor.model.document.on( 'change', () => {
          const changes = editor.model.document.differ.getChanges();
          
          for ( const entry of changes ) {
            if (entry.type === 'attribute' && entry.attributeNewValue === 'uploading') {
              // started uploading
              const submit = editor.sourceElement.closest('.column').querySelector('[index="action"]');
              if (submit) {
                const tasks = parseInt(submit.getAttribute('tasks') || 0) + 1
                submit.setAttribute('disabled', 'disabled');
                submit.setAttribute('tasks', tasks);
              }
            } else if (entry.type === 'attribute' && entry.attributeOldValue === 'uploading') {
              // finished uploading
              const submit = editor.sourceElement.closest('.column').querySelector('[index="action"]');
              if (submit) {
                const tasks = parseInt(submit.getAttribute('tasks') || 0)  - 1;
                if (tasks === 0) {
                  submit.removeAttribute('disabled');
                }
                submit.setAttribute('tasks', tasks);
              }
            }
          }
        } );
        inputRef.current.classList.remove('loading');
          console.log('%c editor %c %O', 'background: #BDBDBD; color: #333; border-radius: 2px;', '', 'ready', editor)
      } }
      onChange={ ( event, editor ) => {
        editor.sourceElement.classList.remove('loading');
          const data = editor.getData();
          inputRef.current.value = data
          inputRef.current.dispatchEvent(new Event('input', {bubbles: true}))
          setValue(data)
      //    console.log( { event, editor, data } );
      } }
      onBlur={ ( event, editor ) => {
      //    console.log( 'Blur.', editor );
      } }
      onFocus={ ( event, editor ) => {
      //    console.log( 'Focus.', editor );
      } }
    />
  }

  return [
    content,
    <input type="hidden" class="loading" ref={inputRef} name={name} value={currentValue} onFill={onExternalChange} />
  ]
}