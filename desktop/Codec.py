#!/usr/bin/env python
import logging
import threading
from NewImageDimensions import NewImageDimensions
from PIL import Image

class Codec(threading.Thread):
  completed = 0
  data_length = 1
  direction = None
  data = None
  result = None

  def __init__(self, symbol_shape, wh_ratio, message_symbol_coder,
               symbol_signal_coder):
    threading.Thread.__init__(self)
    self.symbol_shape = symbol_shape
    self.wh_ratio = wh_ratio
    self.message_symbol_coder = message_symbol_coder
    self.symbol_signal_coder = symbol_signal_coder

  def _new_image_dimensions(self, data):
    data_len = len(data)
    self.new_image_dimensions = NewImageDimensions(
      self.wh_ratio, data_len, self.symbol_shape)

  def set_wh_ratio(self, wh_ratio):
    assert wh_ratio > 0
    logging.info('New wh ratio: %.2f.' % wh_ratio)
    self.wh_ratio = wh_ratio

  def get_prospective_image_dimensions(self, data):
    self._new_image_dimensions(data)
    return self.new_image_dimensions.get_image_dimensions()

  def get_percent_complete(self):
    percent = self.completed / (1. * self.data_length)
    return percent

  def set_data(self, data):
    self.data = data

  def set_direction(self, direction):
    self.direction = direction

  def get_result(self):
    return self.result

  def run(self):
    self.result = None
    if self.direction == 'encode':
      self.encode(self.data)
    elif self.direction == 'decode':
      self.decode(self.data)

  def encode(self, data):
    logging.info('Encoding data.')
    self._new_image_dimensions(data)

    new_image_width, new_image_height = \
        self.new_image_dimensions.get_image_dimensions()
    new_image_symbol_width, new_image_symbol_height = \
        self.new_image_dimensions.get_image_symbol_dimensions()

    logging.info('Creating new image to set pixels (%d, %d).' % \
                   (new_image_width, new_image_height))
    new_image = Image.new('RGB', (new_image_width, new_image_height))
    logging.info('Image dimensions: width (%d) height (%d).' % \
                   (new_image_width, new_image_height))

    pixel = new_image.load()

    shape_width, shape_height = self.symbol_shape.get_shape_size()

    _shape_name = self.symbol_shape.get_name()
    _symbol_to_signal = self.symbol_signal_coder.symbol_to_signal
    _message_to_symbol = self.message_symbol_coder.message_to_symbol
    _num_symbol_shapes = self.symbol_shape.get_num_symbol_shapes()

    coords = {}
    for sym_i in range(_num_symbol_shapes):
      coords[sym_i + 1] = self.symbol_shape.get_symbol_shape_coords(sym_i + 1)

    self.data_length = len(data)
    self.completed = 0

    for i, datum in enumerate(data):
      self.completed += 1

      y_coord = int(i / (1. * new_image_symbol_width))
      x_coord = int(i - (y_coord * new_image_symbol_width))
      symbol_values = _message_to_symbol(datum)

      assert (len(symbol_values) == _num_symbol_shapes)

      base_x = x_coord * shape_width
      base_y = y_coord * shape_height

      _fill_0 = _symbol_to_signal(symbol_values[0])
      fill_0 = (_fill_0, _fill_0, _fill_0)

      _fill_1 = _symbol_to_signal(symbol_values[1])
      fill_1 = (_fill_1, _fill_1, _fill_1)

      if _shape_name == 'two_square':
        pixel[base_x + 0, base_y + 0] = fill_0
        pixel[base_x + 1, base_y + 0] = fill_0
        pixel[base_x + 1, base_y + 1] = fill_0
        pixel[base_x + 0, base_y + 1] = fill_0

        pixel[base_x + 2, base_y + 0] = fill_1
        pixel[base_x + 3, base_y + 0] = fill_1
        pixel[base_x + 3, base_y + 1] = fill_1
        pixel[base_x + 2, base_y + 1] = fill_1

      else:
        for sym_i, symbol_val in enumerate(symbol_values):
          fill = _symbol_to_signal(symbol_val)
          for x,y in coords[sym_i + 1]:
            pixel[base_x + x, base_y + y] = (fill, fill, fill)

    self.result = new_image


  def decode(self, read_image):
    width, height = read_image.size
    image = read_image.convert('RGB') # Ensure format is correct.

    shape_width, shape_height = self.symbol_shape.get_shape_size()
    pixels = image.load()
    extracted_data = ''

    _num_symbol_shapes = self.symbol_shape.get_num_symbol_shapes()
    _symbol_to_message = self.message_symbol_coder.symbol_to_message
    _signal_to_symbol = self.symbol_signal_coder.signal_to_symbol
    _get_symbol_shape_coords = self.symbol_shape.get_symbol_shape_coords

    for y_coord in range(0, height, shape_height):
      for x_coord in range(0, width, shape_width):
        values = {}
        for symbol_val in range(_num_symbol_shapes):
          coords = _get_symbol_shape_coords(symbol_val+1)
          values[symbol_val] = {}
          for x,y in coords:
            values[symbol_val][(x,y)] = pixels[x_coord + x, y_coord + y]

        extracted_datum = _symbol_to_message(_signal_to_symbol(values))
        extracted_data += extracted_datum
    self.result = extracted_data
