import turtle


def draw_square(size=200):
    """Draw a square of the given size using turtle."""
    for _ in range(4):
        turtle.forward(size)
        turtle.left(90)


if __name__ == '__main__':
    draw_square(300)  # adjust size as needed for a "big" square
    turtle.done()