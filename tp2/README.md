# SGI 2022/2023 - TP2

## Group T04G06 - Gym

| Name             | Number    | E-Mail               |
| ---------------- | --------- | -------------------- |
| Margarida Vieira | 201907907 | up201907907@fe.up.pt |
| Tiago Silva      | 201906045 | up201906045@fe.up.pt |

---

## Project Information

The [patches.xml](scenes/patches.xml) scene consists of the following:

### Components

- from TP1:
  - three posters representing what we like to call "Wall of Fame"
  - an olympic barbell with two plates and the correspondent rack
  - a plates rack with multiple plates, those with different weights
  - three wall balls of different sizes
  - two dumbbells with the same weight
  - two comfortable yoga mattresses
  - a bench
  - a box
  - a boxe bag
  - a digital wall clock
- modified/added in TP2:
  - [*added*] a v-grip handle made with tent patches
  - [*added*] two shelves with three protein jars each, each of which is made with a barrel patch (the jar itself) and a cylindrical barrel patch (the jar's lid)
  - [*modified*] a plates rack whose upper structures are made with tent patches
  - [*modified*] a boxe bag with the punching structure made with a cylindrical barrel patch
  - [*modified*] the walls, floor and posters are now made with a rectangle patch
  - [*modified*] each wall ball color is now a material

### Animations

- boxe bag being punched
- execution of a bench press set on the incline bench
- exchange of the plates on the olympic bar
- plates spinning on the floor and hitting the box, causing it to shake (slight scale)
- bench and bar position adjustment to perform the exercise

**IMPORTANT**: We created yet another _.xml_ file with multiple textures per component (functionality already implemented in the previous delivery, TP1) - [patches-multiple-textures.xml](scenes/patches-multiple-textures.xml), so that the original [patches.xml](scenes/patches.xml) would remain compatible with all parsers.

### Shaders

The `highlighted` tag was added to the following components:

- `digital-clock-display`
- `frame-cbum-picture`
- `frame-ronnie-picture`
- `frame-minion-picture`

---

## Extras

- We added two optimal parameters to the `keyframeanim` tag of an animation: `loop` and `loop_time`. By setting `loop` to `true`, the user must specify the `loop_time`, correspondent to the duration of each animation's loop.

- An optimization concerning the textures was implemented - textures that are defined but not used in any component are not loaded.

- Similarly to the previously mentioned optimization, another one was implemented as well, regarding the animations - the unused animations are not updated.

---

## Issues/Problems

Not really an issue but, we started by fixing minor mistakes from the last delivery that the teacher had warned us about before going on to the development of this delivery.

We ran into a tiny hitch with the animations because we were applying the transformations out of order. As a consequence, we had to redo them, which was a significant inconvenience.

Nonetheless, not many more difficulties were encountered.

