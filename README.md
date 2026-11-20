# Tiny House — prototipo web

Prototipo de demostración del sitio de Tiny House: catálogo de casas modulares y configurador (medidas, distribución, revestimiento, terminaciones y extras).

- `Main.dc.html` — fuente de la página (formato DC).
- `index.html` — versión estática lista para publicar. **Se genera, no se edita a mano.**
- `tools/build.py` + `tools/runtime.js` — generan `index.html` desde `Main.dc.html`.

## Actualizar la página

```bash
python tools/build.py
```

Luego haz commit de `Main.dc.html` e `index.html`.

## Publicación

GitHub Pages: *Settings → Pages → Deploy from a branch → `main` / `(root)`*.

> Es una demo: el formulario de contacto no envía datos, y los precios, plazos y datos de contacto son referenciales.
